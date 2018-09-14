import pprint

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch
from data_explorer.util.reverse_nested_Facet import ReverseNestedFacet

from elasticsearch_dsl import HistogramFacet
from flask import current_app
import urllib


def _is_histogram_facet(facet):
    if isinstance(facet, HistogramFacet):
        return True
    # For some reason using isinstance doesn't work here for 
    # ReverseNestedFacet. I believe it has to do with the
    # relative importing of the class in __main__.py where it's 
    # created.
    elif hasattr(facet, 'nested_facet'):
        return _is_histogram_facet(facet.nested_facet)


def _get_interval(facet):
    if isinstance(facet, HistogramFacet):
        return facet._params['interval']
    elif hasattr(facet, 'nested_facet'):
        return _get_interval(facet.nested_facet)


def facets_get(filter=None):  # noqa: E501
    """facets_get

    Returns facets. # noqa: E501

    :param filter: filter represents selected facet values. Elasticsearch query will be run only over selected facet values. filter is an array of strings, where each string has the format \&quot;facetName&#x3D;facetValue\&quot;. Example url /facets?filter&#x3D;Gender&#x3D;female,Region&#x3D;northwest,Region&#x3D;southwest
    :type filter: List[str]

    :rtype: FacetsResponse
    """
    search = DatasetFacetedSearch(deserialize(filter))
    es_response = search.execute()
    es_response_facets = es_response.facets.to_dict()
    # Uncomment to print facets
    # current_app.logger.info(pprint.pformat(es_response_facets))
    facets = []
    for name, field in current_app.config['UI_FACETS'].iteritems():
        description = field.get('description')
        es_facet = current_app.config['ELASTICSEARCH_FACETS'][name]
        values = []
        for value_name, count, _ in es_response_facets[name]:
            if _is_histogram_facet(es_facet):
                # For histograms, Elasticsearch returns:
                #   name 10: count 15     (There are 15 people aged 10-19)
                #   name 20: count 33     (There are 33 people aged 20-29)
                # Convert "10" -> "10-19".
                value_name = _number_to_range(value_name,
                                              _get_interval(es_facet))
            else:
                # elasticsearch-dsl returns boolean field keys as 0/1. Use the
                # field's 'type' to convert back to boolean, if necessary.
                if field['type'] == 'boolean':
                    value_name = bool(value_name)
            values.append(FacetValue(name=value_name, count=count))

        # Add a '(samples)' text to the end of sample facet titles.
        if hasattr(es_facet, 'nested_facet'):
            name = '%s (samples)' % name
        facets.append(Facet(name=name, description=description, values=values))

    return FacetsResponse(
        facets=facets, count=es_response._faceted_search.count())


def deserialize(filter_arr):
    """
    :param filter_arr: an array of strings with format "facet_name=facet_value".
    A facet_name may be repeated if multiple filters are desired.
    :return: A dict of facet_name:[facet_value] mappings.
    """
    if not filter_arr or filter_arr == [""]:
        return {}
    parsed_filter = {}
    # filter_str looks like "Gender=male"
    for facet_filter in filter_arr:
        filter_str = urllib.unquote(facet_filter).decode('utf8')
        key_val = filter_str.split('=')
        name = key_val[0]

        es_facet = current_app.config['ELASTICSEARCH_FACETS'][name]
        if isinstance(es_facet, HistogramFacet):
            value = _range_to_number(key_val[1])
        else:
            value = key_val[1]

        if not name in parsed_filter:
            parsed_filter[name] = [value]
        else:
            parsed_filter[name].append(value)
    return parsed_filter


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


def _range_to_number(interval_str):
    """Converts "X-Y" -> "X"."""
    if not '-' in interval_str:
        return int(interval_str)

    number = interval_str.split('-')[0]
    number = number.replace('M', '000000')
    number = number.replace('B', '000000000')
    if '.' in number:
        return float(number)
    else:
        return int(number)
