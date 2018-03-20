from elasticsearch import Elasticsearch
from flask import current_app

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from ..dataset_faceted_search import DatasetFacetedSearch


def facets_get():
    """
    Returns facets.

    Returns:
        List of Facets.
    """
    search = DatasetFacetedSearch()
    response = search.execute()
    facets = []
    for facet_name, values in response.facets.to_dict().iteritems():
        facet_values = []
        for name, count, _ in values:
            facet_values.append(FacetValue(name=name, count=count))
        facets.append(Facet(name=facet_name, values=facet_values))
    return FacetsResponse(facets=facets, count=response._faceted_search.count())
