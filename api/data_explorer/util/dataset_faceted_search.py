"""Subclass of FacetedSearch for Data Explorer datasets."""

from collections import OrderedDict
from flask import current_app

from elasticsearch import Elasticsearch
from elasticsearch_dsl import FacetedSearch


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets."""

    def __init__(self, filters={}):
        """
        :param filters: a dictionary of facet_name:[object] values to filter
        the query on.
        Ex: {'Region':['southeast', 'northwest'], 'Gender':['male']}.
        """
        self.index = current_app.config['INDEX_NAME']
        self.facets = OrderedDict(
            current_app.config['ELASTICSEARCH_FACETS'].items() +
            current_app.config['EXTRA_FACETS'].items())
        self.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Now that using is set, create _s.
        super(DatasetFacetedSearch, self).__init__(None, filters)

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
