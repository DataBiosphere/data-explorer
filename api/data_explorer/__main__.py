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
from elasticsearch.exceptions import ConnectionError
from elasticsearch.exceptions import TransportError
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import Mapping
from elasticsearch_dsl import Search
from elasticsearch_dsl import TermsFacet

from .encoder import JSONEncoder
import dataset_faceted_search

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


def _wait_elasticsearch_healthy():
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
        raise EnvironmentError("Elasticsearch failed to start.")


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


def _get_dataset_name():
    """Gets dataset name from dataset.json."""
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                               'dataset.json')
    return _parse_json_file(config_path)['name']


def _get_table_names():
    """Gets an alphabetically ordered list of table names from bigquery.json.
    Table names are fully qualified: <project id>:<dataset id>:<table name>

    If bigquery.json doesn't exist, this returns an empty list.
    """
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                               'bigquery.json')
    table_names = []
    if os.path.isfile(config_path):
        table_names = _parse_json_file(config_path)['table_names']
        table_names.sort()
    return table_names


def _get_ui_facets():
    """Returns a dict from UI facet name to UI facet description.
    If there is no description for a facet, the value is None.
    """
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    facets_config = _parse_json_file(config_path)['facets']

    # Preserve order, so facets are returned in same order as the config file.
    facets = OrderedDict()

    for facet_config in facets_config:
        if 'ui_facet_description' in facet_config:
            facets[facet_config['ui_facet_name']] = facet_config[
                'ui_facet_description']
        else:
            facets[facet_config['ui_facet_name']] = None

    app.app.logger.info('UI facets: %s' % facets)
    return facets


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
    try:
        mapping = es.indices.get_field_mapping(
            fields=field_name,
            index=app.app.config['INDEX_NAME'],
            doc_type='type')
    except TransportError as e:
        if 'index_not_found_exception' in e.error:
            app.app.logger.error('Index %s not found at %s' %
                                 (app.app.config['INDEX_NAME'],
                                  app.app.config['ELASTICSEARCH_URL']))
            raise e
    except Exception as e:
        app.app.logger.error('Problem getting mappings: %s' % str(e))
        raise e

    if mapping == {}:
        raise ValueError(
            'elasticsearch_field_name %s not found in Elasticsearch index %s' %
            (field_name, app.app.config['INDEX_NAME']))

    # If field_name is "a.b.c", last_part is "c".
    last_part = field_name.split('.')[len(field_name.split('.')) - 1]
    return mapping[app.app.config['INDEX_NAME']]['mappings']['type'][
        field_name]['mapping'][last_part]['type']


def _get_max_field_value(es, field_name):
    response = Search(
        using=es, index=app.app.config['INDEX_NAME']
    ).aggs.metric(
        'max',
        'max',
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        field=field_name).params(size=0).execute()
    return response.aggregations['max']['value']


def _get_bucket_size(max_field_value):
    if max_field_value < 20:
        return 2
    else:
        # Make the ranges easy to read (10-19,20-29 instead of 10-17,18-25).
        return 10


def _get_es_facets():
    """Returns a dict from UI facet name to Elasticsearch facet object."""
    es = Elasticsearch(app.app.config['ELASTICSEARCH_URL'])
    config_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'ui.json')
    facets_config = _parse_json_file(config_path)['facets']

    # Preserve order, so facets are returned in same order as the config file.
    facets = OrderedDict()

    for facet_config in facets_config:
        field_name = facet_config['elasticsearch_field_name']
        field_type = _get_field_type(es, field_name)
        ui_facet_name = facet_config['ui_facet_name']
        if field_type == 'text':
            # Use ".keyword" because we want aggregation on keyword field, not
            # term field. See
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
            facets[ui_facet_name] = TermsFacet(field=field_name + '.keyword')
        else:
            # Assume numeric type.
            # Creating this facet is a two-step process.
            # 1) Get max value
            # 2) Based on max value, determine bucket size. Create
            #    HistogramFacet with this bucket size.
            # TODO: When https://github.com/elastic/elasticsearch/issues/31828
            # is fixed, use AutoHistogramFacet instead. Will no longer need 2
            # steps.
            max_field_value = _get_max_field_value(es, field_name)
            facets[ui_facet_name] = HistogramFacet(
                field=field_name, interval=_get_bucket_size(max_field_value))
    app.app.logger.info('Elasticsearch facets: %s' % facets)
    return facets


# Read config files. Just do this once; don't need to read files on every
# request.
@app.app.before_first_request
def init():
    # _wait_elasticsearch_healthy() reads from app.app.config. If we move this
    # outside of init(), Flask complains that we're working outside of
    # application context. @app.app.before_first_request guarantees that app
    # context has been set up.
    _wait_elasticsearch_healthy()

    app.app.config['DATASET_NAME'] = _get_dataset_name()
    app.app.config['INDEX_NAME'] = _convert_to_index_name(_get_dataset_name())
    app.app.config['UI_FACETS'] = _get_ui_facets()
    app.app.config['ELASTICSEARCH_FACETS'] = _get_es_facets()
    app.app.config['TABLE_NAMES'] = _get_table_names()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
