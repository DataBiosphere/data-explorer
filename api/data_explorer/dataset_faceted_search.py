"""Subclass of FacetedSearch for Data explorer datasets."""

import csv
import jsmin
import json

from flask import current_app

from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import Mapping
from elasticsearch_dsl import TermsFacet


def get_index_name():
    """Gets index name from dataset.json."""
    with open('/app/config/dataset.json') as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        dataset = json.loads(jsmin.jsmin(f.read()))
        return dataset['name']


def get_facets():
    """Gets facets from facet_fields.csv.

    app.config['ELASTICSEARCH_URL'], app.config['INDEX_NAME'] must be set before
    this is called.
    """
    f = open('/app/config/facet_fields.csv')
    # Remove comments using jsmin.
    csv_str = jsmin.jsmin(f.read())
    facet_rows = csv.DictReader(iter(csv_str.splitlines()), skipinitialspace=True)

    using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    mapping = Mapping.from_es(current_app.config['INDEX_NAME'], 'type',
            using=using).to_dict()
    facets = {}
    for facet_row in facet_rows:
        field_name = facet_row['readable_field_name']
        field_type = mapping['type']['properties'][field_name]['type']
        if field_type == 'text':
            # Use ".keyword" because we want aggregation on keyword field, not
            # term field. See
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
            facets[field_name] = TermsFacet(field=field_name + '.keyword')
        else:
            # Assume numeric type.
            # TODO: Handle other types.
            facets[field_name] = HistogramFacet(field=field_name, interval=7)
    current_app.logger.info('dataset_faceted_search facets: %s' % facets)
    return facets


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets.

    app.config['ELASTICSEARCH_URL'], app.config['INDEX_NAME'], and
    app.config['FACETS'] must be set before creating a DatasetFacetedSearch
    object.
    """

    def __init__(self):
        self.index = current_app.config['INDEX_NAME']
        self.facets = current_app.config['FACETS']
        self.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Now that using is set, create _s.
        super(DatasetFacetedSearch, self).__init__()

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
