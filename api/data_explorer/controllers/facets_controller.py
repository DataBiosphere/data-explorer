from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import TermsFacet
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
            es_facet = current_app.config['ELASTICSEARCH_FACETS'][facet_name]
            if isinstance(es_facet, HistogramFacet):
              # For histograms, Elasticsearch returns:
              #   name 10: count 15     (There are 15 people aged 10-19)
              #   name 20: count 33     (There are 33 people aged 20-29)
              # Convert "10" -> "10-19".
              range_str = '%d-%d' % (name,
                  name + es_facet._params['interval'] - 1)
              facet_values.append(FacetValue(name=range_str, count=count))
            else:
              facet_values.append(FacetValue(name=name, count=count))
        facets.append(Facet(name=facet_name, values=facet_values))
    return FacetsResponse(facets=facets, count=response._faceted_search.count())
