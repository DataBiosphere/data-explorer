"""Subclass of FacetedSearch for Data explorer datasets."""

import jsmin
import json

from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import TermsFacet


def _get_index_name():
    """Gets index name from /app/dataset.json."""
    with open('/app/dataset.json') as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        dataset = json.loads(jsmin.jsmin(f.read()))
        return dataset['name']


def _get_facets():
    return {
        # Use ".keyword" because we want aggregation on keyword field, not term
        # field. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
        'Age': HistogramFacet(field='Age.keyword'),
        'Gender': TermsFacet(field='Gender.keyword'),
        'Region': TermsFacet(field='Region.keyword'),
    }


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets.

    This class body is run when module is loaded; there is no app context yet.
    App context contains configuration such as Elasticsearch URL. To use this
    class, specify Elasticsearch URL like so:

        search = DatasetFacetedSearch()
        search.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Need to rebuild search._s with new s.using.
        search.__init__()
        response = search.execute()
    """
    index = _get_index_name()
    facets = _get_facets()

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
