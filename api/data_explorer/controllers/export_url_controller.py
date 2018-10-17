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

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from flask import request
from flask import current_app
from werkzeug.exceptions import BadRequest
from google.cloud import storage
from oauth2client.service_account import ServiceAccountCredentials

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501
from data_explorer.util import elasticsearch_util
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch

# Export to Saturn flow
# - User clicks export button on bottom right of Data Explorer
# - A dialog pops up, asking user to name cohort. User types "African females"
#   and clicks Export button
# - UI server calls API server /export_url (this file):
#   - Constructs a JSON array of JSON entity objects
#   - Writes JSON array to a GCS file
#   - Concat that with an existing samples JSON entity file, which contains
#     all the samples in the dataset and is created on indexing.
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


def _get_doc_generator(filter_arr):
    if len(filter_arr) == 0:
        return

    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    es_facets = OrderedDict(current_app.config['ELASTICSEARCH_FACETS'].items())
    filters = elasticsearch_util.get_facet_value_dict(filter_arr, es_facets)
    search_dict = DatasetFacetedSearch(filters,
                                       es_facets).build_search().to_dict().get(
                                           'post_filter', {})
    search = Search(using=es, index=current_app.config['INDEX_NAME'])
    search.update_from_dict({'post_filter': search_dict})
    for result in search.scan():
        yield result.to_dict()


def _get_entities_dict(cohort_name, query, filter_arr):
    """Returns a dict representing the JSON list of entities."""
    # Saturn add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name, description in current_app.config['TABLE_NAMES'].iteritems():
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
                'table_name': table_name,
                'table_description': description
            }
        })

    # If a cohort was selected, create a query entity and get Elasticsearch documents
    # for the cohort so we can create sample_set entity.
    if cohort_name:
        entities.append({
            'entityType': 'cohort',
            'name': cohort_name,
            'attributes': {
                'query': query
            }
        })

        sample_items = []
        for doc in _get_doc_generator(filter_arr):
            sample_items.extend([{
                'entityType': 'sample',
                'entityName': s['sample_id']
            } for s in doc.get('samples', [])])
        entities.append({
            'entityType': 'sample_set',
            'name': cohort_name,
            'attributes': {
                'samples': {
                    'itemsType': 'EntityReference',
                    'items': sample_items
                }
            }
        })

    return entities


def _random_str():
    # Random 10 character string
    return ''.join(
        random.choice(string.ascii_letters + string.digits) for _ in range(10))


def _write_gcs_file(entities):
    """Returns GCS file path of the format /bucket/object."""
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    export_bucket = client.get_bucket(
        current_app.config['EXPORT_URL_GCS_BUCKET'])
    samples_bucket = client.get_bucket(
        current_app.config['EXPORT_URL_SAMPLES_GCS_BUCKET'])

    # Copy the samples blob to the export bucket in order to compose with the other
    # object containing the rest of the entities JSON.
    samples_blob = samples_bucket.get_blob('samples')
    copied_samples_blob = export_bucket.blob('samples')
    # Use the rewrite rather than the copy API because the copy can timeout.
    copied_samples_blob.rewrite(samples_blob)

    blob = export_bucket.blob(_random_str())
    entities_json = json.dumps(entities)
    # Remove the leading '[' character since this is being concatenated with the
    # sample entities JSON, which has the trailing ']' stripped in the indexer.
    entities_json = ',%s' % entities_json[1:]
    blob.upload_from_string(entities_json)

    merged = export_bucket.blob(_random_str())
    merged.upload_from_string('')
    merged.compose([copied_samples_blob, blob])

    current_app.logger.info(
        'Wrote gs://%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'],
                              merged.name))
    # Return in the format that signing a URL needs.
    return '/%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'],
                       merged.name)


def _create_signed_url(gcs_path):
    private_key_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                                    'private-key.json')
    creds = ServiceAccountCredentials.from_json_keyfile_name(private_key_path)
    service_account_email = current_app.config[
        'DEPLOY_PROJECT_ID'] + '@appspot.gserviceaccount.com'
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


def _get_facet_and_value(filter):
    facets = current_app.config['UI_FACETS']
    split = filter.rsplit('=', 1)
    return facets[split[0]], split[1]


def _get_table_and_clause(facet, value, sample_file_column_fields):
    """Returns a table name and a single condition of a WHERE clause,
    eg "((age76 >= 20 AND age76 < 30) OR (age76 >= 30 AND age76 < 40))".
    """
    sample_file_type_field = False
    es_field_name = ''
    if facet['type'] == 'samples_overview':
        es_field_name = facet['elasticsearch_field_names'][value]
        value = True
    else:
        es_field_name = facet['elasticsearch_field_name']

    if es_field_name.startswith('samples.'):
        es_field_name = es_field_name.replace('samples.', '')
        # Check if this is one of the special '_has_<file_type>' facets.
        stripped = es_field_name.replace('_has_', '')
        if stripped in sample_file_column_fields:
            es_field_name = sample_file_column_fields[stripped]
            sample_file_type_field = True

    table_name, column = es_field_name.rsplit('.', 1)
    if sample_file_type_field:
        if value == True:
            clause = '%s IS NOT NULL' % column
        else:
            clause = '%s IS NULL' % column
    elif facet['type'] == 'text':
        clause = '%s = "%s"' % (column, value)
    elif facet['type'] == 'boolean':
        clause = '%s = %s' % (column, value)
    else:
        clause = _get_range_clause(column, value)
    return table_name, column, clause


def _get_filter_query(filters):
    if not filters or not len(filters):
        return ''

    sample_file_column_fields = {
        k.lower().replace(" ", "_"): v
        for k, v in current_app.config['SAMPLE_FILE_COLUMNS'].iteritems()
    }

    table_columns = dict()
    for filter_str in filters:
        facet, value = _get_facet_and_value(filter_str)
        table_name, column, clause = _get_table_and_clause(
            facet, value, sample_file_column_fields)
        if table_name in table_columns:
            if column in table_columns[table_name]:
                table_columns[table_name][column].append(clause)
            else:
                table_columns[table_name][column] = [clause]
        else:
            table_columns[table_name] = {column: [clause]}

    table_selects = []
    participant_id_column = current_app.config['PARTICIPANT_ID_COLUMN']
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
            table_select % (participant_id_column, table_name, where_clause))

    query = "SELECT DISTINCT t1.%s FROM " % participant_id_column
    cnt = 1
    for table_select in table_selects:
        table = "%s t%d" % (table_select, cnt)
        join = " INNER JOIN %s ON t%d.%s = t%d.%s"
        if cnt > 1:
            query = query + join % (table, cnt - 1, participant_id_column, cnt,
                                    participant_id_column)
        else:
            query = query + table
        cnt = cnt + 1
    return query


def export_url_post():  # noqa: E501
    _check_preconditions()
    data = json.loads(request.data)
    filter_arr = data['filter']

    current_app.logger.info('Export URL request data %s' % request.data)

    # TODO(malathir): Add extraFacets to this endpoint
    query = _get_filter_query(filter_arr)
    cohort_name = data['cohortName'].replace(" ", "_")
    entities = _get_entities_dict(cohort_name, query, filter_arr)

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
