import pprint

from data_explorer.models.facet import Facet
from data_explorer.models.facet_value import FacetValue
from data_explorer.models.facets_response import FacetsResponse
from data_explorer.models.field import Field
from data_explorer.models.fields_response import FieldsResponse
from elasticsearch_dsl import HistogramFacet
from flask import current_app

from ..dataset_faceted_search import DatasetFacetedSearch
import urllib


def fields_get():
    """fields_get

    Returns fields.

    rtype: FieldsResponse
    """
    # Return a static set of fields for now. When the indexer is ready call that to get the list of fields.
    fields = []
    fields.append(
        Field(
            name="Age",
            description="Age of participant",
            elasticsearch_name="project.dataset.table.Age"))
    fields.append(
        Field(
            name="RNA name",
            description="RNA sequence",
            elasticsearch_name="project.dataset.table.RNA"))
    fields.append(
        Field(
            name="DNA name",
            description="DNA sequence",
            elasticsearch_name="project.dataset.table.DNA"))
    fields.append(
        Field(
            name="Address",
            description="Mailing address",
            elasticsearch_name="project.dataset.table.Address"))
    fields.append(
        Field(
            name="Phone",
            description="Contact number",
            elasticsearch_name="project.dataset.table.Phone"))
    fields.append(
        Field(
            name="Smoking",
            description="How often person smokes",
            elasticsearch_name="project.dataset.table.Smoke"))
    fields.append(
        Field(
            name="Drinking",
            description="How often person drinks",
            elasticsearch_name="project.dataset.table.Drink"))
    fields.append(
        Field(
            name="Exercise",
            description="Exercise the participant does",
            elasticsearch_name="project.dataset.table.Exercise"))
    return FieldsResponse(fields=fields)


def facets_get(filter=None):  # noqa: E501
    """facets_get

    Returns facets. # noqa: E501

    :param filter: filter represents selected facet values. Elasticsearch query will be run only over selected facet values. filter is an array of strings, where each string has the format \&quot;facetName&#x3D;facetValue\&quot;. Example url /facets?filter&#x3D;Gender&#x3D;female,Region&#x3D;northwest,Region&#x3D;southwest
    :type filter: List[str]

    :param extra_facets: extra_facets represents the additional facets selected by the user from the UI.

    :rtype: FacetsResponse
    """
    search = DatasetFacetedSearch(deserialize(filter))
    es_response = search.execute()
    es_response_facets = es_response.facets.to_dict()
    # Uncomment to print facets
    # current_app.logger.info(pprint.pformat(es_response_facets))
    facets = []
    for name, field in current_app.config['UI_FACETS'].iteritems():
        description = None
        if 'description' in field:
            description = field['description']
        es_facet = current_app.config['ELASTICSEARCH_FACETS'][name]
        values = []
        for value_name, count, _ in es_response_facets[name]:
            if isinstance(es_facet, HistogramFacet):
                # For histograms, Elasticsearch returns:
                #   name 10: count 15     (There are 15 people aged 10-19)
                #   name 20: count 33     (There are 33 people aged 20-29)
                # Convert "10" -> "10-19".
                range_str = _number_to_range(value_name,
                                             es_facet._params['interval'])
                values.append(FacetValue(name=range_str, count=count))
            else:
                values.append(FacetValue(name=value_name, count=count))
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
