"""Subclass of FacetedSearch for Data Explorer datasets."""

from collections import OrderedDict
from flask import current_app

from elasticsearch import Elasticsearch
from elasticsearch_dsl import FacetedSearch


class DatasetFacetedSearch(FacetedSearch):
    """Subclass of FacetedSearch for Datasets."""

    def __init__(self, filters={}, es_facets={}):
        """
        :param filters: a dictionary of facet_name:[object] values to filter
        the query on.
        Ex: {'project_id.dataset_id.table_name.Region':['southeast', 'northwest'], 'project_id.dataset_id.table_name.Gender':['male']}.
        :param es_facets: a dict of facets to perform faceted search on.
        """
        self.index = current_app.config['INDEX_NAME']
        self.facets = dict([
            (elasticsearch_field_name, field['es_facet'])
            for elasticsearch_field_name, field in es_facets.items()
        ])
        self.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
        # Now that using is set, create _s.
        super(DatasetFacetedSearch, self).__init__(None, filters)

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
