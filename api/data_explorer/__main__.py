#!/usr/bin/env python

import argparse
import csv
import connexion
import jsmin
import json
import logging
import os
import time

from collections import OrderedDict
from data_explorer.encoder import JSONEncoder
from data_explorer.util import elasticsearch_util
from elasticsearch import Elasticsearch
from elasticsearch.client.cat import CatClient
from elasticsearch.exceptions import ConnectionError
from elasticsearch.exceptions import TransportError
from google.cloud import bigquery

# gunicorn flags are passed via env variables, so we use these as the default
# values. These arguments will rarely be specified as flags directly, aside from
# occasional use during local debugging.
parser = argparse.ArgumentParser()
parser.add_argument(
    '--path_prefix',
    type=str,
    help='Path prefix, e.g. /api, to serve from',
    default=os.environ.get('PATH_PREFIX'))
parser.add_argument(
    '--elasticsearch_url',
    type=str,
    help='Elasticsearch url, e.g. elasticsearch:9200',
    default=os.environ.get('ELASTICSEARCH_URL'))
parser.add_argument(
    '--dataset_config_dir',
    type=str,
    help='Dataset config dir. Can be relative or absolute',
    default=os.environ.get('DATASET_CONFIG_DIR'))

if __name__ == '__main__':
    parser.add_argument(
        '--port',
        type=int,
        default=8390,
        help='The port on which to serve HTTP requests')
    args = parser.parse_args()
else:
    # Allow unknown args if we aren't the main program, these include flags to
    # gunicorn.
    args, _ = parser.parse_known_args()

app = connexion.App(__name__, specification_dir='./swagger/', swagger_ui=True)
app.app.config['ELASTICSEARCH_URL'] = args.elasticsearch_url
app.app.config['DATASET_CONFIG_DIR'] = args.dataset_config_dir

# Log to stderr.
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.app.logger.addHandler(handler)
app.app.logger.setLevel(logging.INFO)

# Uncomment to see Elasticsearch REST requests and responses. The requests can
# be used with curl.
# handler.setLevel(logging.DEBUG)
# root = logging.getLogger()
# root.addHandler(handler)
# logging.getLogger('elasticsearch').setLevel(logging.DEBUG)

app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml', base_path=args.path_prefix)


def init_elasticsearch():
    # Wait for Elasticsearch to be healthy.
    es = Elasticsearch(app.app.config['ELASTICSEARCH_URL'])
    start = time.time()
    for _ in range(0, 120):
        try:
            es.cluster.health(wait_for_status='yellow')
            app.app.logger.info('Elasticsearch took %d seconds to come up.' %
                                (time.time() - start))
            break
        except ConnectionError:
            app.app.logger.info('Elasticsearch not up yet, will try again.')
            time.sleep(1)
    else:
        raise EnvironmentError('Elasticsearch failed to start.')

    # Use the cached JSON files to load the example 1000 genomes dataset
    # without having to run the indexer.
    if app.app.config['INDEX_NAME'] == '1000_genomes':
        index_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                                  'index.json')
        mappings_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                                     'mappings.json')
        fields_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                                   'fields.json')
        elasticsearch_util.load_index_from_json(
            es, app.app.config['INDEX_NAME'], index_path, mappings_path)
        elasticsearch_util.load_index_from_json(
            es, app.app.config['FIELDS_INDEX_NAME'], fields_path)

    if not es.indices.exists(app.app.config['INDEX_NAME']):
        raise EnvironmentError(
            'Index %s not found at %s' % (app.app.config['INDEX_NAME'],
                                          app.app.config['ELASTICSEARCH_URL']))

    document_count = CatClient(es).count(
        app.app.config['INDEX_NAME'], format='json')[0]['count']
    if document_count == '0':
        raise EnvironmentError('Index %s at %s has 0 documents' % (
            app.app.config['INDEX_NAME'], app.app.config['ELASTICSEARCH_URL']))
    return es


def _parse_json_file(json_path):
    """Opens and returns JSON contents.
    Args:
        json_path: Relative or absolute path of JSON file
    Returns:
        Parsed JSON
    """
    app.app.logger.info('Reading JSON file %s' % json_path)
    with open(json_path, 'r') as f:
        # Remove comments using jsmin, as recommended by JSON creator:
        # https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr
        jsonDict = json.loads(jsmin.jsmin(f.read()))
        return jsonDict


def _process_dataset():
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                               'dataset.json')
    app.app.config['DATASET_NAME'] = _parse_json_file(config_path)['name']
    app.app.config['INDEX_NAME'] = elasticsearch_util.convert_to_index_name(
        app.app.config['DATASET_NAME'])
    app.app.config[
        'FIELDS_INDEX_NAME'] = '%s_fields' % app.app.config['INDEX_NAME']


def _process_ui():
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    config = _parse_json_file(config_path)


def _process_bigquery():
    """Gets an alphabetically ordered list of table names from bigquery.json.
    Table names are fully qualified: <project id>.<dataset id>.<table name>
    If bigquery.json doesn't exist, no configuration paramters are set.
    """
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                               'bigquery.json')
    table_names = []
    participant_id_column = ''
    sample_id_column = ''
    sample_file_columns = {}
    if os.path.isfile(config_path):
        bigquery_config = _parse_json_file(config_path)
        table_names = bigquery_config['table_names']
        participant_id_column = bigquery_config['participant_id_column']
        sample_id_column = bigquery_config.get('sample_id_column', '')
        sample_file_columns = bigquery_config.get('sample_file_columns', {})
        table_names.sort()

    table_names_dict = OrderedDict()
    for full_table_name in table_names:
        splits = full_table_name.rsplit('.', 2)
        if len(splits) != 3:
            raise ValueError(
                'Unknown format for table name %s. Expected BigQuery project_id.dataset_id.table_name'
                % full_table_name)
        project_id, dataset_id, table_name = splits
        client = bigquery.Client(project=project_id)
        dataset_ref = client.dataset(dataset_id, project=project_id)
        table_ref = dataset_ref.table(table_name)
        description = client.get_table(table_ref).description
        table_names_dict[full_table_name] = description

    # A dict from table name (project_id.dataset_id.table_name) to table description.
    app.app.config['TABLES'] = table_names_dict
    app.app.config['PARTICIPANT_ID_COLUMN'] = participant_id_column
    app.app.config['SAMPLE_ID_COLUMN'] = sample_id_column
    app.app.config['SAMPLE_FILE_COLUMNS'] = sample_file_columns


def _process_facets(es):
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    facets_config = _parse_json_file(config_path)['facets']

    # Preserve order, so facets are returned in same order as the config file.
    facets = OrderedDict()

    # Add a 'Samples Overview' facet if sample_file_columns were specified in
    # bigquery.json. This facet is mapped to multiple Elasticsearch facets, and
    # has keys - 'elasticsearch_field_names', 'type', 'ui_facet_name' and 'es_facet'.
    if app.app.config['SAMPLE_FILE_COLUMNS']:
        # Construct Elasticsearch filters. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filters-aggregation.html
        es_field_names = {}
        for name, field in app.app.config['SAMPLE_FILE_COLUMNS'].iteritems():
            facet_name = 'Has %s' % name
            es_field_name = 'samples._has_%s' % name.lower().replace(' ', '_')
            es_field_names[facet_name] = es_field_name
        facets['Samples Overview'] = {
            'elasticsearch_field_names': es_field_names,
            'type': 'samples_overview',
            'ui_facet_name': 'Samples Overview'
        }
        facets['Samples Overview'][
            'es_facet'] = elasticsearch_util.get_samples_overview_facet(
                es_field_names)

    app.app.config['NESTED_PATHS'] = elasticsearch_util.get_nested_paths(es)

    for facet_config in facets_config:
        elasticsearch_field_name = facet_config['elasticsearch_field_name']
        field_type = elasticsearch_util.get_field_type(
            es, elasticsearch_field_name)
        ui_facet_name = facet_config['ui_facet_name']
        if elasticsearch_field_name.startswith('samples.'):
            ui_facet_name = '%s (samples)' % ui_facet_name

        facets[elasticsearch_field_name] = {
            'ui_facet_name': ui_facet_name,
            'type': field_type
        }
        if 'ui_facet_description' in facet_config:
            facets[elasticsearch_field_name]['description'] = facet_config[
                'ui_facet_description']

        facets[elasticsearch_field_name][
            'es_facet'] = elasticsearch_util.get_elasticsearch_facet(
                es, elasticsearch_field_name, field_type)

    # Map from Elasticsearch field name to dict with ui facet name,
    # Elasticsearch field type, optional UI facet description and Elasticsearch
    # facet.
    app.app.config['FACET_INFO'] = facets
    app.app.config['EXTRA_FACET_INFO'] = {}


def _process_export_url():
    """Sets config variables related to /exportUrl endpoint."""
    app.app.config['AUTHORIZATION_DOMAIN'] = ''
    app.app.config['DEPLOY_PROJECT_ID'] = ''
    app.app.config['EXPORT_URL_GCS_BUCKET'] = ''
    app.app.config['EXPORT_URL_SAMPLES_GCS_BUCKET'] = ''

    dataset_config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                                       'dataset.json')
    dataset_config = _parse_json_file(dataset_config_path)
    if 'authorization_domain' in dataset_config:
        app.app.config['AUTHORIZATION_DOMAIN'] = dataset_config[
            'authorization_domain']

    # Check preconditions for Export to Saturn feature. If a precondition fails,
    # print a warning but allow app to continue. Someone may want to run Data
    # Explorer UI locally and not use export to Saturn feature.
    deploy_config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                                      'deploy.json')
    if not os.path.isfile(deploy_config_path):
        app.app.logger.warning(
            'deploy.json not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        return

    deploy_config = _parse_json_file(deploy_config_path)
    if not 'project_id' in deploy_config:
        app.app.logger.warning(
            'Project not set in deploy.json. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
        )
        return

    project_id = deploy_config['project_id']
    if not project_id or project_id == 'PROJECT_ID_TO_DEPLOY_TO':
        app.app.logger.warning(
            'Project not set in deploy.json. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
        )
        return
    else:
        app.app.config['DEPLOY_PROJECT_ID'] = project_id

    app.app.config['EXPORT_URL_GCS_BUCKET'] = project_id + '-export'
    app.app.config[
        'EXPORT_URL_SAMPLES_GCS_BUCKET'] = project_id + '-export-samples'


# On server startup, read and process config files, and populate
# app.app.config. Only do this once, instead of on every request.
# Controllers are expected to read from app.app.config and not from config
# files.
def init():
    with app.app.app_context():
        _process_dataset()
        _process_ui()
        _process_bigquery()
        es = init_elasticsearch()
        _process_facets(es)
        _process_export_url()

        app.app.logger.info('app.app.config:')
        for key in sorted(app.app.config.keys()):
            app.app.logger.info('    %s: %s' % (key, app.app.config[key]))


init()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
