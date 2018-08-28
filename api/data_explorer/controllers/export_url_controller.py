import base64
import connexion
import six
import json
import os
import random
import string
import sys
import time
import urllib

from flask import request
from flask import current_app
from werkzeug.exceptions import BadRequest
from google.cloud import storage
from oauth2client.service_account import ServiceAccountCredentials

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501

# Export to Saturn flow
# - User clicks export button on bottom right of Data Explorer
# - A dialog pops up, asking user to name cohort. User types "African females"
#   and clicks Export button
# - UI server calls API server /export_url (this file):
#   - Constructs a JSON array of JSON entity objects
#   - Writes JSON array to a GCS file
#   - Creates a signed url for GCS file. Returns signed url to UI server
# - UI server redirects to Saturn add-import?url=SIGNED_URL
# - On add-import page, user selects Workspace. User clicks Import button.
# - User is redirected to selected workspace Data tab, showing newly imported
#   entities.


def _check_preconditions():
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        error_msg = (
            'deploy.json not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['DEPLOY_PROJECT_ID']:
        error_msg = (
            'Project not set in deploy.json. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        error_msg = (
            'Project not set in deploy.json or export URL GCS bucket not '
            'found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    private_key_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                                    'private-key.json')
    if not os.path.isfile(private_key_path):
        error_msg = (
            'Private key not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)


def _get_entities_dict(cohort_name, query):
    """Returns a dict representing the JSON list of entities."""
    # Saturn add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name in current_app.config['TABLE_NAMES']:
        splits = table_name.split('.')
        if len(splits) != 3:
            raise BadRequest(
                'Unknown format for table name %s. Expected BigQuery project_id.dataset_id.table_name'
            )
        entities.append({
            # FireCloud doesn't allow spaces, so use underscore.
            'entityType': 'BigQuery_table',
            # This is the entity ID. Ideally this would be
            # project_id.dataset_id.table_name, and we wouldn't need the
            # table_name attribute. Unfortunately RAWLS doesn't allow
            # periods here. RAWLS does allow periods in attributes. So use
            # underscores here and periods in table_name attribute.
            'name': table_name.replace('.', '_'),
            'attributes': {
                'table_name': table_name
            }
        })
    if query and cohort_name:
        entities.append({
            'entityType': 'cohort',
            'name': cohort_name,
            'attributes': {
                'query': query
            }
        })
    return entities


def _write_gcs_file(entities):
    """Returns GCS file path of the format /bucket/object."""
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    bucket = client.get_bucket(current_app.config['EXPORT_URL_GCS_BUCKET'])
    # Random 10 character string
    random_str = ''.join(
        random.choice(string.ascii_letters + string.digits) for _ in range(10))
    blob = bucket.blob(random_str)
    blob.upload_from_string(json.dumps(entities))
    current_app.logger.info(
        'Wrote gs://%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'],
                              random_str))
    # Return in the format that signing a URL needs.
    return '/%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'], random_str)


def _create_signed_url(gcs_path):
    private_key_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                                    'private-key.json')
    creds = ServiceAccountCredentials.from_json_keyfile_name(private_key_path)
    service_account_email = current_app.config['DEPLOY_PROJECT_ID'] + '@appspot.gserviceaccount.com'
    # Signed URL will be valid for 5 minutes
    timestamp = str(int(time.time()) + 5 * 60)
    file_metadata = '\n'.join(['GET', '', '', timestamp, gcs_path])
    signature = base64.b64encode(creds.sign_blob(file_metadata)[1])
    signature = urllib.quote(signature, safe='')
    signed_url = ('https://storage.googleapis.com%s?GoogleAccessId=%s'
                  '&Expires=%s&Signature=%s') % (
                      gcs_path, service_account_email, timestamp, signature)
    # import-data expects url to be url encoded
    signed_url = urllib.quote(signed_url, safe='')
    current_app.logger.info('Signed URL: ' + signed_url)
    return signed_url


def _get_range_clause(column, value):
    arr = value.split('-')
    if len(arr) > 1:
        low = arr[0]
        high = arr[1]
    else:
        return column + " = " + value
    if low.endswith('M'):
        low = int(low[:-1])
        high = int(high[:-1])
        low = low * 1000000
        high = high * 1000000
    elif low.endswith('B'):
        low = int(low[:-1])
        high = int(high[:-1])
        low = low * 1000000000
        high = high * 1000000000

    # low is inclusive, high is exclusive
    # See https://github.com/elastic/elasticsearch-dsl-py/blob/master/elasticsearch_dsl/faceted_search.py#L125
    return column + " >= " + str(low) + " AND " + column + " < " + str(high)


def _get_clause(column, type, value):
    """Returns a single condition of a WHERE clause,
    eg "((age76 >= 20 AND age76 < 30) OR (age76 >= 30 AND age76 < 40))".
    """
    if type == 'text':
        clause = column + ' = "' + value + '"'
    elif type == 'boolean':
        clause = column + ' =' + value
    else:
        clause = _get_range_clause(column, value)
    return clause


def _get_filter_query(filters):
    if not filters or not len(filters):
        return ""
    facets = current_app.config['UI_FACETS']
    table_columns = dict()
    for filter in filters:
        arr = filter.split('=')
        facet = facets[arr[0]]
        filter_value = arr[1]
        arr = facet['elasticsearch_field_name'].rsplit('.', 1)
        table_name = arr[0]
        column = arr[1]
        clause = _get_clause(column, facet['type'], filter_value)
        if table_name in table_columns:
            if column in table_columns[table_name]:
                table_columns[table_name][column].append(clause)
            else:
                table_columns[table_name][column] = [clause]
        else:
            table_columns[table_name] = {column: [clause]}

    table_selects = list()
    primary_key = current_app.config['PRIMARY_KEY']
    for table_name, columns in table_columns.iteritems():
        table_select = "(SELECT %s FROM `%s` WHERE %s)"
        where_clause = ""
        for column, clauses in columns.iteritems():
            column_clause = ""
            for clause in clauses:
                if len(column_clause) > 0:
                    column_clause = column_clause + " OR "
                column_clause = column_clause + "(" + clause + ")"
            if len(where_clause) > 0:
                where_clause = where_clause + " AND "
            where_clause = where_clause + "(" + column_clause + ")"
        table_selects.append(
            table_select % (primary_key, table_name, where_clause))

    query = "SELECT DISTINCT t1.%s FROM " % primary_key
    cnt = 1
    for table_select in table_selects:
        table = "%s t%d" % (table_select, cnt)
        join = " INNER JOIN %s ON t%d.%s = t%d.%s"
        if cnt > 1:
            query = query + join % (table, cnt - 1, primary_key, cnt,
                                    primary_key)
        else:
            query = query + table
        cnt = cnt + 1
    return query


def export_url_post():  # noqa: E501
    _check_preconditions()
    data = json.loads(request.data)
    current_app.logger.info('Export URL request data %s' % request.data)
    query = _get_filter_query(data['filter'])
    cohortname = data['cohortName']
    cohortname = cohortname.replace(" ", "_")
    entities = _get_entities_dict(cohortname, query)
    current_app.logger.info('Entity JSON: %s' % json.dumps(entities))
    # Don't actually write GCS file during unit test. If we wrote a file during
    # unit test, in order to make it easy for anyone to run this test, we would
    # have to create a world-readable bucket.
    if 'pytest' in sys.modules:
        return 'foo'

    gcs_path = _write_gcs_file(entities)
    signed_url = _create_signed_url(gcs_path)
    return ExportUrlResponse(
        url=signed_url,
        authorization_domain=current_app.config['AUTHORIZATION_DOMAIN'])
