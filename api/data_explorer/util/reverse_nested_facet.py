"""Subclass of Facet for filtering top-level documents based on nested fields."""

from elasticsearch_dsl.aggs import A
from elasticsearch_dsl.aggs import ReverseNested
from elasticsearch_dsl.faceted_search import Facet
from elasticsearch_dsl.query import Nested


class ReverseNestedFacet(Facet):
    """Modified implementation of the NestedFacet to support counting root documents. See:

    https://github.com/elastic/elasticsearch-dsl-py/blob/master/elasticsearch_dsl/faceted_search.py#L164
    https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-reverse-nested-aggregation.html
    """
    agg_type = 'nested'

    def __init__(self, path, nested_facet):
        self._path = path
        self._inner = nested_facet
        nested_agg = nested_facet.get_aggregation()
        nested_agg['outer'] = ReverseNested()
        super(ReverseNestedFacet, self).__init__(
            path=path, aggs={'inner': nested_agg})

    def get_values(self, data, filter_values):
        """
        Slight modification of the base clase in order to support retrieving the outer doc count:
        https://github.com/elastic/elasticsearch-dsl-py/blob/master/elasticsearch_dsl/faceted_search.py#L63
        """
        out = []
        for bucket in data.inner.buckets:
            key = self.get_value(bucket)
            out.append((key, bucket.outer['doc_count'],
                        self.is_filtered(key, filter_values)))
        return out

    def add_filter(self, filter_values):
        inner_q = self._inner.add_filter(filter_values)
        if inner_q:
            return Nested(path=self._path, query=inner_q)
