"""Subclass of FacetedSearch for Data explorer datasets."""

import csv
import jsmin
import json
import os

from flask import current_app

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import Mapping
from elasticsearch_dsl import TermsFacet


# Keep in sync with convert_to_index_name() in data-explorer-indexers repo.
def convert_to_index_name(s):
    """Converts a string to an Elasticsearch index name."""
    # For Elasticsearch index name restrictions, see
    # https://github.com/DataBiosphere/data-explorer-indexers/issues/5#issue-308168951
    prohibited_chars = [' ', '"', '*', '\\', '<', '|', ',', '>', '/', '?']
    for char in prohibited_chars:
        s = s.replace(char, '_')
    s = s.lower()
    # Remove leading underscore.
    if s.find('_', 0, 1) == 0:
        s = s.lstrip('_')
    print('Index name: %s' % s)
    return s


def get_index_name():
    """Gets Elasticsearch index name."""
    return convert_to_index_name(get_dataset_name())


def get_dataset_name():
    """Gets dataset name from dataset.json.

    current_app.config['DATASET_CONFIG_DIR'] must be set before this is called.
    """
    file_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                             'dataset.json')
    with open(file_path) as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        dataset = json.loads(jsmin.jsmin(f.read()))
        return dataset['name']


def get_table_names():
    """Gets a list of table names from facet_fields.csv.

    current_app.config['DATASET_CONFIG_DIR'] must be set before this is called.
    """
    table_names = set()
    for row in get_facet_rows():
        table_names.add(row['project_id'] + '.' + row['dataset_id'] + '.' +
                        row['table_name'])
    tables_list = list(table_names)
    tables_list.sort()
    return tables_list


def get_facets():
    """Gets facets from facet_fields.csv.

    current_app.config['ELASTICSEARCH_URL'], current_app.config['INDEX_NAME']
    current_app.config['DATASET_CONFIG_DIR'] must be set before this is called.
    """

    using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    mapping = Mapping.from_es(
        current_app.config['INDEX_NAME'], 'type', using=using).to_dict()
    # Preserve order, so facets are returned in the same order as facet_fields.csv
    facets = OrderedDict()
    for facet_row in get_facet_rows():
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
    current_app.logger.info('dataset_faceted_search facets: %s' % facets)
    return facets


def get_facet_rows():
    """Parses facet_fields.csv as a list.

    current_app.config['DATASET_CONFIG_DIR'] must be set before this is called.
    """
    f = open(
        os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                     'facet_fields.csv'))
    # Remove comments using jsmin.
    csv_str = jsmin.jsmin(f.read())
    return csv.DictReader(iter(csv_str.splitlines()), skipinitialspace=True)


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets.

    current_app.config['ELASTICSEARCH_URL'], current_app.config['INDEX_NAME'],
    and current_app.config['ELASTICSEARCH_FACETS'] must be set before creating a
    DatasetFacetedSearch object.
    """

    def __init__(self, filters={}):
        """
        :param filters: a dictionary of facet_name:[object] values to filter
        the query on.
        Ex: {'Region':['southeast', 'northwest'], 'Gender':['male']}.
        """
        self.index = current_app.config['INDEX_NAME']
        self.facets = current_app.config['ELASTICSEARCH_FACETS']
        self.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Now that using is set, create _s.
        super(DatasetFacetedSearch, self).__init__(None, filters)

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
