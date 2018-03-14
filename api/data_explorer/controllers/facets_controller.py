from datetime import date
import json

from elasticsearch import Elasticsearch
from flask import current_app

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from ..dataset_faceted_search import DatasetFacetedSearch


def facets_get():
    """
    Returns facets.

    Returns:
        List of Facets.
    """
    search = DatasetFacetedSearch()
    search.using = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    # Need to rebuild search._s with new s.using.
    search.__init__()
    response = search.execute()
    facets = []
    for facet_name, values in response.facets.to_dict().iteritems():
        facet_values = []
        for value_name, count, _ in values:
            facet_values.append(FacetValue(value_name=value_name, count=count))
        facets.append(Facet(facet_name=facet_name, values=facet_values))
    return facets
