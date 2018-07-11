"""Subclass of FacetedSearch for Data explorer datasets."""

from flask import current_app

from elasticsearch import Elasticsearch
from elasticsearch_dsl import FacetedSearch


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

        # Elasticsearch expects self.facets to be a dict from facet name to
        # Elasticsearch facet object.
        facets_dict = {}
        for facet_name, _, es_facet in current_app.config[
                'ELASTICSEARCH_FACETS']:
            facets_dict[facet_name] = es_facet
        self.facets = facets_dict

        self.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Now that using is set, create _s.
        super(DatasetFacetedSearch, self).__init__(None, filters)

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
