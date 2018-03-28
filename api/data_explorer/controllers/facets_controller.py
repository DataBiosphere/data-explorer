from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from elasticsearch_dsl import HistogramFacet
from flask import current_app

from ..dataset_faceted_search import DatasetFacetedSearch
import urllib


def facets_get(filter=None):  # noqa: E501
    """facets_get

    Returns facets. # noqa: E501

    :param filter: filter represents selected facet values. Elasticsearch query will be run only over selected facet values. filter is an array of strings, where each string has the format \&quot;facetName&#x3D;facetValue\&quot;. Example url /facets?filter&#x3D;Gender&#x3D;female,Region&#x3D;northwest,Region&#x3D;southwest
    :type filter: List[str]

    :rtype: FacetsResponse
    """
    search = DatasetFacetedSearch(deserialize(filter))
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


def deserialize(filter_arr):
    """
    :param filter_arr: an array of strings with format "facet_name=facet_value".
    A facet_name may be repeated if multiple filters are desired.
    :return: A dict of facet_name:[facet_value] mappings.
    """
    if not filter_arr:
        return {}
    parsed_filter = {}
    for facet_filter in filter_arr:
        filter_str = urllib.unquote(facet_filter).decode('utf8')
        key_val = filter_str.split('=')
        if len(key_val) == 2:
            if not key_val[0] in parsed_filter:
                parsed_filter[key_val[0]] = [key_val[1]]
            else:
                parsed_filter[key_val[0]].append(key_val[1])
    return parsed_filter
