#!/usr/bin/env python

import argparse
import csv
import jsmin
import json
import logging
import os
import time

from collections import OrderedDict
import connexion
from elasticsearch import Elasticsearch
from elasticsearch.client.cat import CatClient
from elasticsearch.exceptions import ConnectionError
from elasticsearch.exceptions import TransportError
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import Mapping
from elasticsearch_dsl import Search
from elasticsearch_dsl import TermsFacet
from google.cloud import storage

from .encoder import JSONEncoder
from util.reverse_nested_facet import ReverseNestedFacet

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

    if not es.indices.exists(app.app.config['INDEX_NAME']):
        raise EnvironmentError(
            'Index %s not found at %s' % (app.app.config['INDEX_NAME'],
                                          app.app.config['ELASTICSEARCH_URL']))

    document_count = CatClient(es).count(
        app.app.config['INDEX_NAME'], format='json')[0]['count']
    if document_count == '0':
        raise EnvironmentError('Index %s at %s has 0 documents' % (
            app.app.config['INDEX_NAME'], app.app.config['ELASTICSEARCH_URL']))


def _parse_json_file(json_path):
    """Opens and returns JSON contents.
  Args:
    json_path: Relative or absolute path of JSON file
  Returns:
    Parsed JSON
  """
    app.app.logger.info('Reading JSON file %s' % json_path)
    with open(json_path, 'r') as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        jsonDict = json.loads(jsmin.jsmin(f.read()))
        return jsonDict


# Keep in sync with convert_to_index_name() in data-explorer-indexers repo.
def _convert_to_index_name(s):
    """Converts a string to an Elasticsearch index name."""
    # For Elasticsearch index name restrictions, see
    # https://github.com/DataBiosphere/data-explorer-indexers/issues/5#issue-308168951
    # Elasticsearch allows single quote in index names. However, they cause other
    # problems. For example,
    # "curl -XDELETE http://localhost:9200/nurse's_health_study" doesn't work.
    # So also remove single quotes.
    prohibited_chars = [
        ' ', '"', '*', '\\', '<', '|', ',', '>', '/', '?', '\''
    ]
    for char in prohibited_chars:
        s = s.replace(char, '_')
    s = s.lower()
    # Remove leading underscore.
    if s.find('_', 0, 1) == 0:
        s = s.lstrip('_')
    print('Index name: %s' % s)
    return s


def _process_dataset():
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                               'dataset.json')
    app.app.config['DATASET_NAME'] = _parse_json_file(config_path)['name']
    app.app.config['INDEX_NAME'] = _convert_to_index_name(
        app.app.config['DATASET_NAME'])


def _process_ui():
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    config = _parse_json_file(config_path)
    app.app.config['ENABLE_FIELD_SEARCH'] = False
    if 'enable_field_search' in config and config['enable_field_search']:
        app.app.config['ENABLE_FIELD_SEARCH'] = True


def _get_field_type(es, field_name):
    # elasticsearch_dsl.Mapping, which gets mappings for all fields, would be
    # easier, but we can't use it.
    # BigQuery indexer uses field names like "project.dataset.table.column".
    # elasticsearch_dsl.Mapping corresponds to
    # "curl /index/_mapping/doc_type". That returns a nested dict:
    #   "project":
    #     "dataset":
    #       ...
    # It's difficult to retrieve type from the nested dict.
    # Instead, we get the type for one field:
    # "curl /index/_mapping/doc_type/project.dataset.table.column".
    # This has the benefit that we can support Elasticsearch documents that are
    # truly nested, such as HCA Orange Box. elasticsearch_field_name in ui.json
    # would be "parent.child".
    mapping = es.indices.get_field_mapping(
        fields=field_name, index=app.app.config['INDEX_NAME'], doc_type='type')

    if mapping == {}:
        raise ValueError(
            'elasticsearch_field_name %s not found in Elasticsearch index %s' %
            (field_name, app.app.config['INDEX_NAME']))

    # If field_name is "a.b.c", last_part is "c".
    last_part = field_name.split('.')[len(field_name.split('.')) - 1]
    return mapping[app.app.config['INDEX_NAME']]['mappings']['type'][
        field_name]['mapping'][last_part]['type']


def _get_field_min_max_agg(es, field_name):
    return Search(
        using=es, index=app.app.config['INDEX_NAME']
    ).aggs.metric(
        'max',
        'max',
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        field=field_name
    ).params(size=0).aggs.metric(
        'min',
        'min',
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        field=field_name).params(size=0).execute()


# TODO(bfcrampton): Generalize this for any nested field
def _get_samples_field_min_max_agg(es, field_name):
    search = Search(using=es, index=app.app.config['INDEX_NAME'])
    search.update_from_dict({
        "aggs": {
            "parent": {
                "nested": {
                    "path": "samples"
                },
                "aggs": {
                    "max": {
                        "max": {
                            "field": field_name
                        }
                    },
                    "min": {
                        "min": {
                            "field": field_name
                        }
                    }
                }
            }
        }
    })
    return search.params(size=0).execute()


def _get_field_range(es, field_name):
    if field_name.startswith('samples.'):
        response = _get_samples_field_min_max_agg(es, field_name)
    else:
        response = _get_field_min_max_agg(es, field_name)
    return (response.aggregations.parent['max']['value'] -
            response.aggregations.parent['min']['value'])


def _get_bucket_interval(field_range):
    if field_range <= 1:
        return .1
    if field_range < 8:
        return 1
    elif field_range < 20:
        return 2
    elif field_range < 150:
        # Make the ranges easy to read (10-19,20-29 instead of 10-17,18-25).
        return 10
    elif field_range < 1500:
        return 100
    elif field_range < 15000:
        return 1000
    elif field_range < 150000:
        return 10000
    elif field_range < 1500000:
        return 100000
    elif field_range < 15000000:
        return 1000000
    elif field_range < 150000000:
        return 10000000
    elif field_range < 1500000000:
        return 100000000
    elif field_range < 15000000000:
        return 1000000000
    elif field_range < 150000000000:
        return 10000000000
    elif field_range < 1500000000000:
        return 100000000000
    else:
        return 1000000000000


def _process_facets():
    """Process facets to store a dict from UI facet name to UI facet description
    ,Elasticsearch field name, and field type, and a dict of UI facet name to
    Elasticsearch facet object. If there is no description for a facet,
    the value is None.
    """

    es = Elasticsearch(app.app.config['ELASTICSEARCH_URL'])
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    facets_config = _parse_json_file(config_path)['facets']

    # Preserve order, so facets are returned in same order as the config file.
    es_facets = OrderedDict()
    ui_facets = OrderedDict()

    for facet_config in facets_config:
        elasticsearch_field_name = facet_config['elasticsearch_field_name']
        field_type = _get_field_type(es, elasticsearch_field_name)
        ui_facet_name = facet_config['ui_facet_name']

        ui_facets[ui_facet_name] = {
            'elasticsearch_field_name': elasticsearch_field_name,
            'type': field_type
        }
        if 'ui_facet_description' in facet_config:
            ui_facets[ui_facet_name]['description'] = facet_config[
                'ui_facet_description']

        if field_type == 'text':
            # Use ".keyword" because we want aggregation on keyword field, not
            # term field. See
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
            es_facets[ui_facet_name] = TermsFacet(
                field=elasticsearch_field_name + '.keyword')
        elif field_type == 'boolean':
            es_facets[ui_facet_name] = TermsFacet(
                field=elasticsearch_field_name)
        else:
            # Assume numeric type.
            # Creating this facet is a two-step process.
            # 1) Get max value
            # 2) Based on max value, determine bucket size. Create
            #    HistogramFacet with this bucket size.
            # TODO: When https://github.com/elastic/elasticsearch/issues/31828
            # is fixed, use AutoHistogramFacet instead. Will no longer need 2
            # steps.
            field_range = _get_field_range(es, elasticsearch_field_name)
            es_facets[ui_facet_name] = HistogramFacet(
                field=elasticsearch_field_name,
                interval=_get_bucket_interval(field_range))

        # Handle sample facets in a special way since they are nested objects.
        if elasticsearch_field_name.startswith('samples.'):
            app.app.logger.info('Nesting facet: %s' % es_facets[ui_facet_name])
            es_facets[ui_facet_name] = ReverseNestedFacet(
                'samples', es_facets[ui_facet_name])

    app.app.logger.info('Elasticsearch facets: %s' % es_facets)
    app.app.config['ELASTICSEARCH_FACETS'] = es_facets
    app.app.logger.info('UI facets: %s' % ui_facets)
    app.app.config['UI_FACETS'] = ui_facets


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
    sample_file_columns = []
    if os.path.isfile(config_path):
        bigquery_config = _parse_json_file(config_path)
        table_names = bigquery_config['table_names']
        participant_id_column = bigquery_config['participant_id_column']
        sample_id_column = bigquery_config['sample_id_column']
        samle_file_cols = bigquery_config.get('sample_file_columns', [])
        table_names.sort()

    app.app.config['TABLE_NAMES'] = table_names
    app.app.config['PARTICIPANT_ID_COLUMN'] = participant_id_column
    app.app.config['SAMPLE_ID_COLUMN'] = sample_id_column
    app.app.config['SAMPLE_FILE_COLUMNS'] = sample_file_columns


def _process_export_url():
    """Sets config variables related to /exportUrl endpoint."""
    app.app.config['AUTHORIZATION_DOMAIN'] = ''
    app.app.config['DEPLOY_PROJECT_ID'] = ''
    app.app.config['EXPORT_URL_GCS_BUCKET'] = ''

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

    project_id = _parse_json_file(deploy_config_path)['project_id']
    if project_id == 'PROJECT_ID_TO_DEPLOY_TO':
        app.app.logger.warning(
            'Project not set in deploy.json. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
        )
        return
    else:
        app.app.config['DEPLOY_PROJECT_ID'] = project_id

    app.app.config['EXPORT_URL_GCS_BUCKET'] = project_id + '-export'
    client = storage.Client(project=project_id)
    if not client.lookup_bucket(app.app.config['EXPORT_URL_GCS_BUCKET']):
        app.app.logger.warning(
            'Bucket %s not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
            % app.app.config['EXPORT_URL_GCS_BUCKET'])


# Read config files. Just do this once; don't need to read files on every
# request.
@app.app.before_first_request
def init():
    # _get_dataset_name() reads from app.app.config. If we move this
    # outside of init(), Flask complains that we're working outside of
    # application context. @app.app.before_first_request guarantees that app
    # context has been set up.

    _process_dataset()
    _process_ui()
    init_elasticsearch()
    _process_facets()
    _process_bigquery()
    _process_export_url()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
