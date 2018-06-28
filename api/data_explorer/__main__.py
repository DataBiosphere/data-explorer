#!/usr/bin/env python

import argparse
import csv
import jsmin
import json
import logging
import os

from collections import OrderedDict
import connexion
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import TransportError
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import Mapping
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
    file_path = os.path.join(app.app.config['DATASET_CONFIG_DIR'],
                             'dataset.json')
    with open(file_path) as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        dataset = json.loads(jsmin.jsmin(f.read()))
        return dataset['name']


def _get_facet_rows():
    """Parses facet_fields.csv as a list."""
    f = open(
        os.path.join(app.app.config['DATASET_CONFIG_DIR'], 'facet_fields.csv'))
    # Remove comments using jsmin.
    csv_str = jsmin.jsmin(f.read())
    return csv.DictReader(iter(csv_str.splitlines()), skipinitialspace=True)


def _get_table_names():
    """Gets an alphabetically ordered list of table names from facet_fields.csv.

    Table names are fully qualified: <project id>:<dataset id>:<table name>
    """
    table_names = set()
    for row in _get_facet_rows():
        table_names.add(row['project_id'] + '.' + row['dataset_id'] + '.' +
                        row['table_name'])
    tables_list = list(table_names)
    tables_list.sort()
    return tables_list


def _get_facets():
    """Gets facets from facet_fields.csv.

    app.app.config['ELASTICSEARCH_URL'], app.app.config['INDEX_NAME']
    app.app.config['DATASET_CONFIG_DIR'] must be set before this is called.
    """

    using = Elasticsearch(app.app.config['ELASTICSEARCH_URL'])
    try:
        mapping = Mapping.from_es(
            app.app.config['INDEX_NAME'], 'type', using=using).to_dict()
    except TransportError as e:
        if 'index_not_found_exception' in e.error:
            app.app.logger.error('Index %s not found at %s' %
                                 (app.app.config['INDEX_NAME'],
                                  app.app.config['ELASTICSEARCH_URL']))
            raise e

    # Preserve order, so facets are returned in the same order as facet_fields.csv
    facets = OrderedDict()
    for facet_row in _get_facet_rows():
        field_name = facet_row['readable_field_name']
        field_type = mapping['type']['properties'][field_name]['type']
        if field_type == 'text':
            # Use ".keyword" because we want aggregation on keyword field, not
            # term field. See
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
            facets[field_name] = TermsFacet(
                field=field_name + '.keyword', size=20)
        else:
            # Assume numeric type.
            # TODO: Handle other types.
            # TODO: Automatically figure out bucket intervals. Unfortunately
            # Elasticsearch won't do this for us
            # (https://github.com/elastic/elasticsearch/issues/9572). Make the
            # ranges easy to read (10-19,20-29 instead of 10-17,18-25).
            facets[field_name] = HistogramFacet(field=field_name, interval=10)
    app.app.logger.info('dataset_faceted_search facets: %s' % facets)
    return facets


# Read config files. Just do this once; don't need to read files on every
# request.
@app.app.before_first_request
def init():
    # get_dataset_name() reads from app.app.config. If we move this outside
    # of init(), Flask complains that we're working outside of application
    # context. @app.app.before_first_request guarantees that app context has
    # been set up.
    app.app.config['DATASET_NAME'] = _get_dataset_name()
    app.app.config['INDEX_NAME'] = _convert_to_index_name(_get_dataset_name())
    app.app.config['ELASTICSEARCH_FACETS'] = _get_facets()
    app.app.config['TABLE_NAMES'] = _get_table_names()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
