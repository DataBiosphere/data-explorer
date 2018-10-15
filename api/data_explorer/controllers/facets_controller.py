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

    es_facets = OrderedDict()
    ui_facets = OrderedDict()

    if not extra_facets:
        return es_facets, ui_facets

    nested_paths = elasticsearch_util.get_nested_paths(es)

    for elasticsearch_field_name in extra_facets:
        if not elasticsearch_field_name:
            continue

        arr = elasticsearch_field_name.split('.')
        ui_facet_name = arr[-1]
        field_type = elasticsearch_util.get_field_type(
            es, elasticsearch_field_name)
        ui_facets[ui_facet_name] = {
            'elasticsearch_field_name': elasticsearch_field_name,
            'type': field_type
        }
        # TODO(malathir): Figure out how to get description of the field.
        es_facets[ui_facet_name] = elasticsearch_util.get_elasticsearch_facet(
            es, elasticsearch_field_name, field_type, nested_paths)

    return es_facets, ui_facets


def _number_to_range(interval_start, interval):
    """Converts "X" -> "X-Y"."""
    if interval < 1:
        # Return something like "0.1-0.2"
        return '%s-%s' % (interval_start, interval_start + interval)
    elif interval == 1:
        # Return something like "5"
        return '%d' % interval_start
    if interval < 1000000:
        # Return something like "10-19"
        return '%d-%d' % (interval_start, interval_start + interval)
    elif interval < 1000000000:
        # Return something like "10M-20M"
        return '%dM-%dM' % (interval_start / 1000000,
                            (interval_start + interval) / 1000000)
    else:
        # Return something like "10B-20B"
        return '%dB-%dB' % (interval_start / 1000000000,
                            (interval_start + interval) / 1000000000)


def facets_get(filter=None, extraFacets=None):  # noqa: E501
    """facets_get
    Returns facets. # noqa: E501
    :param filter: filter represents selected facet values. Elasticsearch query will be run only over selected facet values. filter is an array of strings, where each string has the format \&quot;facetName&#x3D;facetValue\&quot;. Example url /facets?filter&#x3D;Gender&#x3D;female,Region&#x3D;northwest,Region&#x3D;southwest
    :type filter: List[str]
    :param extraFacets: extra_facets represents the additional facets selected by the user from the UI.
    :type extraFacets: List[str]
    :rtype: FacetsResponse
    """
    extra_es_facets, extra_ui_facets = _process_extra_facets(extraFacets)
    combined_es_facets = OrderedDict(extra_es_facets.items() + current_app.
                                     config['ELASTICSEARCH_FACETS'].items())
    combined_ui_facets = OrderedDict(extra_ui_facets.items() +
                                     current_app.config['UI_FACETS'].items())
    search = DatasetFacetedSearch(
        elasticsearch_util.get_facet_value_dict(filter, combined_es_facets),
        combined_es_facets)
    # Uncomment to print Elasticsearch request python object
    # current_app.logger.info(
    #     'Query: %s' % pprint.pformat(search.build_search().to_dict()))
    es_response = search.execute()
    es_response_facets = es_response.facets.to_dict()
    # Uncomment to print Elasticsearch response python object
    # current_app.logger.info(pprint.pformat(es_response_facets))
    facets = []
    for name, field in combined_ui_facets.iteritems():
        description = field.get('description')
        es_facet = combined_es_facets[name]
        values = []
        for value_name, count, _ in es_response_facets[name]:
            if elasticsearch_util.is_histogram_facet(es_facet):
                # For histograms, Elasticsearch returns:
                #   name 10: count 15     (There are 15 people aged 10-19)
                #   name 20: count 33     (There are 33 people aged 20-29)
                # Convert "10" -> "10-19".
                value_name = _number_to_range(value_name,
                                              _get_bucket_interval(es_facet))
            else:
                # elasticsearch-dsl returns boolean field keys as 0/1. Use the
                # field's 'type' to convert back to boolean, if necessary.
                if field['type'] == 'boolean':
                    value_name = bool(value_name)
            values.append(FacetValue(name=value_name, count=count))
        facets.append(Facet(name=name, description=description, values=values))

    return FacetsResponse(
        facets=facets, count=es_response._faceted_search.count())
