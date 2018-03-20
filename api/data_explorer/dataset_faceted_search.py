"""Subclass of FacetedSearch for Data explorer datasets."""

import jsmin
import json

from flask import current_app

from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import TermsFacet


def get_index_name():
    """Gets index name from /app/dataset.json."""
    with open('/app/dataset.json') as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        dataset = json.loads(jsmin.jsmin(f.read()))
        return dataset['name']


def get_facets():
    """Gets facets from /app/facet_fields.csv."""
    return {
        'Age': HistogramFacet(field='Age', interval=7),
        # Use ".keyword" because we want aggregation on keyword field, not term
        # field. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
        'Gender': TermsFacet(field='Gender.keyword'),
        'Region': TermsFacet(field='Region.keyword'),
    }


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets.

    app.config['ELASTICSEARCH_URL'], app.config['INDEX_NAME'], and
    app.config['FACETS'] must be set before creating a DatasetFacetedSearch
    object.
    """

    def __init__(self):
        """Initializes DatasetFacetedSearch object.

        Contains initialization that should be done once over the lifetime of
        the Flask server, rather than once per request. For example, there's no
        need to read facet_fields.csv for every request.
        """
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
