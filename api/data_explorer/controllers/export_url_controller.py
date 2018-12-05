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

# Send to Terra flow
# - User clicks export button on bottom right of Data Explorer
# - A dialog pops up, asking user to name cohort. User types "African females"
#   and clicks Export button
# - UI server calls API server /export_url (this file):
#   - Constructs a JSON array of JSON entity objects
#   - Writes JSON array to a GCS file
#   - Concat that with an existing samples JSON entity file, which contains
#     all the samples in the dataset and is created on indexing.
#   - Creates a signed url for GCS file. Returns signed url to UI server
# - UI server redirects to Terra add-import?url=SIGNED_URL
# - On add-import page, user selects Workspace. User clicks Import button.
# - User is redirected to selected workspace Data tab, showing newly imported
#   entities.


def _check_preconditions():
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        error_msg = (
            'deploy.json not found. Send to Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['DEPLOY_PROJECT_ID']:
        error_msg = (
            'Project not set in deploy.json. Send to Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        error_msg = (
            'Project not set in deploy.json or export URL GCS bucket not '
            'found. Send to Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    private_key_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                                    'private-key.json')
    if not os.path.isfile(private_key_path):
        error_msg = (
            'Private key not found. Send to Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)


def _get_doc_generator(filter_arr):
    if len(filter_arr) == 0:
        return

    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    combined_facets = OrderedDict(
        current_app.config['EXTRA_FACET_INFO'].items() +
        current_app.config['FACET_INFO'].items())
    filters = elasticsearch_util.get_facet_value_dict(filter_arr,
                                                      combined_facets)
    search_dict = DatasetFacetedSearch(
        filters, combined_facets).build_search().to_dict().get(
            'post_filter', {})
    search = Search(using=es, index=current_app.config['INDEX_NAME'])
    search.update_from_dict({'post_filter': search_dict})
    for result in search.scan():
        yield result.to_dict()


def _get_entities_dict(cohort_name, query, filter_arr):
    """Returns a dict representing the JSON list of entities."""
    # Terra add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name in current_app.config['TABLES']:
        entities.append({
            # FireCloud doesn't allow spaces, so use underscore.
            'entityType':
            'BigQuery_table',
            # This is the entity ID. Ideally this would be
            # project_id.dataset_id.table_name, and we wouldn't need the
            # table_name attribute. Unfortunately RAWLS doesn't allow
            # periods here. RAWLS does allow periods in attributes. So use
            # underscores here and periods in table_name attribute.
            'name':
            table_name.replace('.', '_').replace(':', '_'),
            'attributes': {
                'table_name': table_name
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

        if current_app.config['SAMPLE_ID_COLUMN']:
            sample_id_column = current_app.config['SAMPLE_ID_COLUMN']
            sample_items = []
            for doc in _get_doc_generator(filter_arr):
                sample_items.extend([{
                    'entityType': 'sample',
                    'entityName': s[sample_id_column]
                } for s in doc.get('samples', [])])
            if len(sample_items) > 0:
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
    user = os.environ.get('USER')
    samples_file_name = '%s-%s-samples' % (current_app.config['INDEX_NAME'],
                                           user)
    blob = export_bucket.blob(_random_str())
    entities_json = json.dumps(entities)

    samples_blob = samples_bucket.get_blob(samples_file_name)
    if samples_blob:
        # Copy the samples blob to the export bucket in order to compose with the other
        # object containing the rest of the entities JSON.
        copied_samples_blob = export_bucket.blob(samples_file_name)
        # Use the rewrite rather than the copy API because the copy can timeout.
        copied_samples_blob.rewrite(samples_blob)

        # Remove the leading '[' character since this is being concatenated with the
        # sample entities JSON, which has the trailing ']' stripped in the indexer.
        entities_json = ',%s' % entities_json[1:]
        blob.upload_from_string(entities_json)
        merged = export_bucket.blob(_random_str())
        merged.upload_from_string('')
        merged.compose([copied_samples_blob, blob])
        blob = merged
    else:
        blob.upload_from_string(entities_json)

    current_app.logger.info(
        'Wrote gs://%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'],
                              blob.name))
    # Return in the format that signing a URL needs.
    return '/%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'], blob.name)


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


def _get_table_and_clause(es_field_name, field_type, value,
                          sample_file_column_fields):
    """Returns a table name and a single condition of a WHERE clause,
    eg "((age76 >= 20 AND age76 < 30) OR (age76 >= 30 AND age76 < 40))".
    """
    sample_file_type_field = False
    if field_type == 'samples_overview':
        es_field_name = current_app.config['FACET_INFO']['Samples Overview'][
            'elasticsearch_field_names'][value]
        value = True

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
    elif field_type == 'text':
        clause = '%s = "%s"' % (column, value)
    elif field_type == 'boolean':
        clause = '%s = %s' % (column, value)
    else:
        clause = _get_range_clause(column, value)
    return table_name, column, clause


def _get_filter_query(filters):
    if not filters or not len(filters):
        return ''

    participant_id_column = current_app.config['PARTICIPANT_ID_COLUMN']
    sample_file_column_fields = {
        k.lower().replace(" ", "_"): v
        for k, v in current_app.config['SAMPLE_FILE_COLUMNS'].iteritems()
    }

    # facet_table_clauses must have two levels of nesting (facet_id, table_name)
    # because clauses from the same column are OR'ed together, whereas clauses
    # from different columns are AND'ed together.
    facet_table_clauses = {}
    for filter_str in filters:
        splits = filter_str.rsplit('=', 1)
        # facet_id is "Samples Overview" for the Samples Overview facet, and
        # es_field_name for all other facets.
        facet_id = splits[0]
        value = splits[1]
        field_type = ''
        if facet_id in current_app.config['FACET_INFO']:
            field_type = current_app.config['FACET_INFO'][facet_id]['type']
        elif facet_id in current_app.config['EXTRA_FACET_INFO']:
            field_type = current_app.config['EXTRA_FACET_INFO'][facet_id][
                'type']
        table_name, column, clause = _get_table_and_clause(
            facet_id, field_type, value, sample_file_column_fields)

        if facet_id not in facet_table_clauses:
            facet_table_clauses[facet_id] = {}
        if table_name not in facet_table_clauses[facet_id]:
            facet_table_clauses[facet_id][table_name] = []
        facet_table_clauses[facet_id][table_name].append(clause)

    # Map from table name to list of where clauses.
    table_wheres = {}
    table_num = 1
    table_select = '(SELECT %s FROM `%s` WHERE %s)'
    query = 'SELECT DISTINCT t1.%s FROM ' % participant_id_column

    def _append_to_query(existing, new, join, table_num):
        return existing + join if table_num > 1 else existing + new

    # Handle the clauses on a per-facet level.
    for facet_id, table_clauses in facet_table_clauses.iteritems():
        table_wheres_current_facet = {}
        for table_name, clauses in table_clauses.iteritems():
            where = ''
            for clause in clauses:
                if len(where) > 0:
                    where += ' OR (%s)' % clause
                else:
                    where = '(%s)' % clause
            table_wheres_current_facet[table_name] = where

        if len(table_wheres_current_facet) == 1:
            # If all of the facet where caluses are on the same table, add it
            # to the table_wheres map for coalescing by table below.
            # All normal, non-Samples Overview facets fall under this case.
            if table_name not in table_wheres:
                table_wheres[table_name] = []
            table_wheres[table_name].append(
                table_wheres_current_facet[table_name])
        else:
            # Normally, different columns are AND'ed together.
            # Different columns within Samples Overview facet are OR'ed together.
            # OR is done using FULL JOIN in case columns are from different tables.
            for table_name, where in table_wheres_current_facet.iteritems():
                select = table_select % (participant_id_column, table_name,
                                         where)
                table = '%s t%d' % (select, table_num)
                join = ' FULL JOIN %s ON t%d.%s = t%d.%s' % (
                    table, table_num - 1, participant_id_column, table_num,
                    participant_id_column)
                query = _append_to_query(query, table, join, table_num)
                table_num += 1

    # Coalesce all where clauses for facet's which span a single table into
    # one select per table.
    for table_name, wheres in table_wheres.iteritems():
        where_clause = ''
        for where in wheres:
            if len(where_clause) > 0:
                where_clause += ' AND '
            where_clause += ' (%s)' % where

        select = table_select % (participant_id_column, table_name,
                                 where_clause)
        table = '%s t%d' % (select, table_num)
        join = ' INNER JOIN %s ON t%d.%s = t%d.%s' % (
            table, table_num - 1, participant_id_column, table_num,
            participant_id_column)
        query = _append_to_query(query, table, join, table_num)
        table_num += 1

    return query


def export_url_post():  # noqa: E501
    _check_preconditions()
    data = json.loads(request.data)
    filter_arr = data['filter']

    current_app.logger.info('Export URL request data %s' % request.data)

    query = _get_filter_query(filter_arr)
    cohort_name = data['cohortName']
    for c in ' .:=':
        cohort_name = cohort_name.replace(c, '_')

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
