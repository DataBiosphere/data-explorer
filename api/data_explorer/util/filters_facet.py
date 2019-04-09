"""Subclass of Facet for performing faceted search with bucketed filter expressions."""

from elasticsearch_dsl.faceted_search import Facet
from elasticsearch_dsl.query import Filtered


class FiltersFacet(Facet):
    """
    Custom facet for creating aggregation buckets based on filters that can span multiple fields.
    See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filters-aggregation.html
    """
    agg_type = 'filters'

    def __init__(self, filters):
        self._filters = filters
        super(FiltersFacet, self).__init__(filters=filters)

    def get_values(self, data, filter_values):
        """
        Slight modification of the base class because the response format for filters aggregations is 
        slightly different.
        """
        out = []
        for key, val in data.buckets.to_dict().iteritems():
            out.append(
                (key, val['doc_count'], self.is_filtered(key, filter_values)))
        return sorted(out, key=lambda v: v[1], reverse=True)

    def get_value_filter(self, filter_value):
        """
        Extract the filter which corresponds to this filter value.
        """
        return self._filters[filter_value]
