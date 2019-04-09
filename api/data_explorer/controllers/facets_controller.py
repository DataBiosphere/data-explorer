import pprint

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from flask import current_app

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from data_explorer.util import elasticsearch_util
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch


def _get_bucket_interval(facet):
    if isinstance(facet, HistogramFacet):
        return facet._params['interval']
    elif hasattr(facet, '_inner'):
        return _get_bucket_interval(facet._inner)


def _process_extra_facets(extra_facets):
    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])

    facets = OrderedDict()

    if not extra_facets:
        current_app.config['EXTRA_FACET_INFO'] = {}
        return

    for elasticsearch_field_name in extra_facets:
        if not elasticsearch_field_name:
            continue

        arr = elasticsearch_field_name.split('.')
        ui_facet_name = arr[-1]
        field_type = elasticsearch_util.get_field_type(
            es, elasticsearch_field_name)
        facets[elasticsearch_field_name] = {
            'ui_facet_name': ui_facet_name,
            'type': field_type
        }
        facets[elasticsearch_field_name][
            'description'] = elasticsearch_util.get_field_description(
                es, elasticsearch_field_name)
        facets[elasticsearch_field_name][
            'es_facet'] = elasticsearch_util.get_elasticsearch_facet(
                es, elasticsearch_field_name, field_type)

    # Map from Elasticsearch field name to dict with ui facet name,
    # Elasticsearch field type, optional UI facet description and Elasticsearch
    # facet. This map is for extra facets added from the field search dropdown
    # on the UI.
    # This must be stored separately from FACET_INFO. If this were added to
    # FACET_INFO, then if user deletes extra facets chip, we wouldn't know which
    # facet to remove from FACET_INFO.
    current_app.config['EXTRA_FACET_INFO'] = facets


def facets_get(filter=None, extraFacets=None):  # noqa: E501
    """facets_get
    Returns facets. # noqa: E501
    :param filter: filter represents selected facet values. Elasticsearch query
    will be run only over selected facet values. filter is an array of strings,
    where each string has the format \&quot;facetName&#x3D;facetValue\&quot;.
    Example url /facets?filter=project_id.dataset_id.table_name.Gender=female,project_id.dataset_id.table_name.Region=northwest,project_id.dataset_id.table_name.Region=southwest
    :type filter: List[str]
    :param extraFacets: extra_facets represents the additional facets selected by the user from the UI.
    :type extraFacets: List[str]
    :rtype: FacetsResponse
    """
    _process_extra_facets(extraFacets)
    combined_facets = OrderedDict(
        current_app.config['EXTRA_FACET_INFO'].items() +
        current_app.config['FACET_INFO'].items())
    search = DatasetFacetedSearch(
        elasticsearch_util.get_facet_value_dict(filter, combined_facets),
        combined_facets)
    # Uncomment to print Elasticsearch request python object
    # current_app.logger.info(
    #     'Elasticsearch request: %s' % pprint.pformat(search.build_search().to_dict()))
    es_response = search.execute()
    es_response_facets = es_response.facets.to_dict()
    # Uncomment to print Elasticsearch response python object
    #current_app.logger.info(
    #    'Elasticsearch response: %s' % pprint.pformat(es_response_facets))
    facets = []
    for es_field_name, facet_info in combined_facets.iteritems():
        values = []
        facet = facet_info.get('es_facet')
        for value_name, count, _ in es_response_facets[es_field_name]:
            if elasticsearch_util.is_histogram_facet(facet):
                # For histograms, Elasticsearch returns:
                #   name 10: count 15     (There are 15 people aged 10-19)
                #   name 20: count 33     (There are 33 people aged 20-29)
                # Convert "10" -> "10-19".
                value_name = elasticsearch_util.number_to_range(
                    value_name, _get_bucket_interval(facet))
            else:
                # elasticsearch-dsl returns boolean field keys as 0/1. Use the
                # field's 'type' to convert back to boolean, if necessary.
                if facet_info['type'] == 'boolean':
                    value_name = bool(value_name)
            values.append(FacetValue(name=value_name, count=count))
        facets.append(
            Facet(name=facet_info.get('ui_facet_name'),
                  description=facet_info.get('description'),
                  values=values,
                  es_field_name=es_field_name,
                  es_field_type=facet_info.get('type')))

    return FacetsResponse(facets=facets,
                          count=es_response._faceted_search.count())
