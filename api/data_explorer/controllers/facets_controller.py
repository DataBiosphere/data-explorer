from datetime import date
import json

from flask import current_app

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from ..dataset_faceted_search import DatasetFacetedSearch


def facets_get():
    """
    facets_get
    Returns facets.

    :rtype: 
    """
    search = DatasetFacetedSearch()
    response = search.execute()
    #current_app.logger.info('fs ' + fs)
    current_app.logger.info('response.facets.to_dict() %s' % response.facets.to_dict())
    #import pdb; import readline; pdb.set_trace()
    facets = []
    for facet_name, values in response.facets.to_dict().iteritems():
        current_app.logger.info('facet_name ' + facet_name)
        current_app.logger.info('values %s' % values)
        facet_values = []
        for value_name, count, _ in values:
            facet_values.append(FacetValue(value_name=value_name, count=count))
            current_app.logger.info('value_name ' + value_name)
            current_app.logger.info('count %d' % count)
        facets.append(Facet(facet_name=facet_name, values=facet_values))
    current_app.logger.info('facets %s' % facets)
    return facets
    #return 'yo'
