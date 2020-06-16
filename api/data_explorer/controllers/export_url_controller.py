import base64
import connexion
import six
import json
import os
import random
import string
import sys
import time
import urllib.parse

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl import HistogramFacet
from flask import request
from flask import current_app
from werkzeug.exceptions import BadRequest
from google.cloud import storage
from oauth2client.service_account import ServiceAccountCredentials

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501
from data_explorer.util import elasticsearch_util
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch

# Save in Terra flow
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
            'deploy.json not found. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['DEPLOY_PROJECT_ID']:
        error_msg = (
            'Project not set in deploy.json. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        error_msg = (
            'Project not set in deploy.json or export URL GCS bucket not '
            'found. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    private_key_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                                    'private-key.json')
    if not os.path.isfile(private_key_path):
        error_msg = (
            'Private key not found. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)


def _get_range_clause(column, value, bucket_interval):
    """Returns an SQL clause specifying that column is in the range
    specified by value. Uses bucket_interval to avoid potentially
    ambiguous ranges such as 1.0B-1.9B, which really means [1B, 2B).
    """
    if value[0] == '-':
        # avoid minus sign with split
        arr = value[1:].split('-', 1)
        arr[0] = '-' + arr[0]
    else:
        arr = value.split('-', 1)
    if len(arr) > 1:
        low = arr[0]
        high = arr[1]
    else:
        return column + " = " + value
    if low.endswith('M'):
        low = int(round(float(low[:-1]) * 1000000))
        high = low + bucket_interval
    elif low.endswith('B'):
        low = int(round(float(low[:-1]) * 1000000000))
        high = low + bucket_interval
    elif '.' not in low:
        low = int(low)
        high = low + bucket_interval

    # low is inclusive, high is exclusive
    # See https://github.com/elastic/elasticsearch-dsl-py/blob/master/elasticsearch_dsl/faceted_search.py#L125
    return column + " >= " + str(low) + " AND " + column + " < " + str(high)


def _get_table_and_clause(es_field_name, field_type, value, bucket_interval,
                          sample_file_column_fields, is_time_series,
                          time_series_column):
    """Returns a table name and a single condition of a WHERE clause,
    eg "((age76 >= 20 AND age76 < 30) OR (age76 >= 30 AND age76 < 40))".
    """
    sample_file_type_field = False

    if es_field_name.startswith('samples.'):
        es_field_name = es_field_name.replace('samples.', '')
        # Check if this is one of the special '_has_<file_type>' facets.
        stripped = es_field_name.replace('_has_', '')
        if stripped in sample_file_column_fields:
            es_field_name = sample_file_column_fields[stripped]
            sample_file_type_field = True
    if is_time_series:
        table_name, column, tsv = es_field_name.rsplit('.', 2)
        tsv = tsv.replace('_', '.')
        if tsv == 'Unknown':
            tsv = 'NULL'
            op = 'IS'
        else:
            op = '='
        assert not sample_file_type_field
        if field_type == 'text':
            clause = '%s = "%s" AND %s %s %s' % (column, value,
                                                 time_series_column, op, tsv)
        elif field_type == 'boolean':
            clause = '%s = %s AND %s %s %s' % (column, value,
                                               time_series_column, op, tsv)
        else:
            clause = '%s AND %s %s %s' % (_get_range_clause(
                column, value, bucket_interval), time_series_column, op, tsv)
    else:
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
            clause = _get_range_clause(column, value, bucket_interval)
    return table_name, column, clause


def _get_bucket_interval(facet):
    if isinstance(facet, HistogramFacet):
        return facet._params['interval']
    elif hasattr(facet, '_inner'):
        return _get_bucket_interval(facet._inner)
    else:
        return None


def _get_all_participants_query():
    participant_id = current_app.config['PARTICIPANT_ID_COLUMN']
    query = 'SELECT DISTINCT %s FROM (' % participant_id
    query += 'SELECT %s FROM `%s`' % (participant_id,
                                      current_app.config['TABLES'][0])
    for table in current_app.config['TABLES'][1:]:
        query += ' UNION DISTINCT SELECT %s FROM `%s`' % (participant_id,
                                                          table)
    query += ')'
    return query


def _get_sql_query(filters):
    participant_id_column = current_app.config['PARTICIPANT_ID_COLUMN']
    sample_file_column_fields = {
        k.lower().replace(" ", "_"): v
        for k, v in current_app.config['SAMPLE_FILE_COLUMNS'].items()
    }
    time_series_column = current_app.config['TIME_SERIES_COLUMN']

    if not filters or not len(filters):
        return _get_all_participants_query()

    # facet_table_clauses must have two levels of nesting (facet_id, table_name)
    # because clauses from the same column are OR'ed together, whereas clauses
    # from different columns are AND'ed together.
    facet_table_clauses = {}
    for filter_str in filters:
        splits = filter_str.rsplit('=', 1)
        es_field_name = splits[0]
        value = splits[1]
        field_type = ''
        is_time_series = False
        bucket_interval = None
        if es_field_name in current_app.config['FACET_INFO']:
            field_type = current_app.config['FACET_INFO'][es_field_name]['type']
            is_time_series = current_app.config['FACET_INFO'][es_field_name].get(
                'time_series_field', False)
            bucket_interval = _get_bucket_interval(
                current_app.config['FACET_INFO'][es_field_name]['es_facet'])
        elif es_field_name in current_app.config['EXTRA_FACET_INFO']:
            field_type = current_app.config['EXTRA_FACET_INFO'][es_field_name][
                'type']
            is_time_series = current_app.config['EXTRA_FACET_INFO'][
                es_field_name].get('time_series_field', False)
            bucket_interval = _get_bucket_interval(
                current_app.config['EXTRA_FACET_INFO'][es_field_name]['es_facet'])
        table_name, column, clause = _get_table_and_clause(
            es_field_name, field_type, value, bucket_interval,
            sample_file_column_fields, is_time_series, time_series_column)

        if es_field_name not in facet_table_clauses:
            facet_table_clauses[es_field_name] = {}
        if table_name not in facet_table_clauses[es_field_name]:
            facet_table_clauses[es_field_name][table_name] = []
        facet_table_clauses[es_field_name][table_name].append(clause)

    # Map from table name to list of where clauses.
    table_wheres = {}
    table_num = 1
    table_select = '(SELECT %s FROM `%s` WHERE %s)'
    query = 'SELECT DISTINCT t1.%s FROM ' % participant_id_column

    def _append_to_query(existing, new, join, table_num):
        return existing + join if table_num > 1 else existing + new

    # Handle the clauses on a per-facet level.
    for facet_id, table_clauses in facet_table_clauses.items():
        table_wheres_current_facet = {}
        for table_name, clauses in table_clauses.items():
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
            # All normal, non-"_has_sample_type" facets fall under this case.
            if table_name not in table_wheres:
                table_wheres[table_name] = []
            table_wheres[table_name].append(
                table_wheres_current_facet[table_name])
        else:
            # Normally, different columns are AND'ed together.
            # Different columns within a "_has_sample_type" facet are OR'ed together.
            # OR is done using FULL JOIN in case columns are from different tables.
            for table_name, where in table_wheres_current_facet.items():
                select = table_select % (participant_id_column, table_name,
                                         where)
                table = '%s t%d' % (select, table_num)
                join = ' FULL JOIN %s ON t%d.%s = t%d.%s' % (
                    table, table_num - 1, participant_id_column, table_num,
                    participant_id_column)
                query = _append_to_query(query, table, join, table_num)
                table_num += 1

    # Coalesce all where clauses for facets that span a single table
    # using INTERSECT DISTINCT. Cannot just use one WHERE clause with
    # AND's because multiple rows may have the same participant id for
    # time series data.
    for table_name, wheres in table_wheres.items():
        intersect_clause = ''
        for where in wheres:
            if len(intersect_clause) > 0:
                intersect_clause += ' INTERSECT DISTINCT '
            intersect_clause += table_select % (participant_id_column,
                                                table_name, where)

        select = '(%s)' % (intersect_clause)
        table = '%s t%d' % (select, table_num)
        join = ' INNER JOIN %s ON t%d.%s = t%d.%s' % (
            table, table_num - 1, participant_id_column, table_num,
            participant_id_column)
        query = _append_to_query(query, table, join, table_num)
        table_num += 1

    return query


def _get_entities_dict(cohort_name, filter_arr, data_explorer_url):
    """Returns a dict representing the JSON list of entities."""
    # Terra add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name in current_app.config['TABLES']:
        entities.append({
            # FireCloud doesn't allow spaces, so use underscore.
            'entityType': 'BigQuery_table',
            # This is the entity ID. Ideally this would be
            # project_id.dataset_id.table_name, and we wouldn't need the
            # table_name attribute. Unfortunately RAWLS doesn't allow
            # periods here. RAWLS does allow periods in attributes. So use
            # underscores here and periods in table_name attribute.
            'name': table_name.replace('.', '_').replace(':', '_'),
            'attributes': {
                'dataset_name': current_app.config['DATASET_NAME'],
                'table_name': table_name,
            }
        })

    entities.append({
        'entityType': 'cohort',
        'name': cohort_name,
        'attributes': {
            'dataset_name': current_app.config['DATASET_NAME'],
            'query': _get_sql_query(filter_arr),
            'data_explorer_url': data_explorer_url,
        }
    })

    return entities


def _write_gcs_file(entities):
    """Returns GCS file path of the format /bucket/object."""
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    export_bucket = client.get_bucket(
        current_app.config['EXPORT_URL_GCS_BUCKET'])
    user = os.environ.get('USER')
    random_str = ''.join(
        random.choice(string.ascii_letters + string.digits) for _ in range(10))
    blob = export_bucket.blob(random_str)
    entities_json = json.dumps(entities)
    blob.upload_from_string(entities_json)

    current_app.logger.info(
        'Wrote gs://%s/%s' %
        (current_app.config['EXPORT_URL_GCS_BUCKET'], blob.name))
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
    signature = urllib.parse.quote(signature, safe='')
    signed_url = ('https://storage.googleapis.com%s?GoogleAccessId=%s'
                  '&Expires=%s&Signature=%s') % (
                      gcs_path, service_account_email, timestamp, signature)
    # import-data expects url to be url encoded
    signed_url = urllib.parse.quote(signed_url, safe='')
    current_app.logger.info('Signed URL: ' + signed_url)
    return signed_url


def export_url_post():  # noqa: E501
    _check_preconditions()
    data = json.loads(request.data)
    current_app.logger.info('Export URL request data %s' % request.data)

    entities = _get_entities_dict(data['cohortName'], data['filter'],
                                  data['dataExplorerUrl'])
    gcs_path = _write_gcs_file(entities)
    signed_url = _create_signed_url(gcs_path)
    return ExportUrlResponse(
        url=signed_url,
        authorization_domain=current_app.config['AUTHORIZATION_DOMAIN'])
