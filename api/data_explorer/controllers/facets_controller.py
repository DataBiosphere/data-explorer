import pprint

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import HistogramFacet
from flask import current_app

from data_explorer.models.facet import Facet
from data_explorer.models.facets_response import FacetsResponse
from data_explorer.util import elasticsearch_util
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch


def _get_bucket_interval(facet):
    if isinstance(facet, HistogramFacet):
        return facet._params['interval']
    elif hasattr(facet, '_inner'):
        return _get_bucket_interval(facet._inner)


def _add_facet(es_field_name, is_time_series, parent_is_time_series,
               time_series_panel, separate_panel, time_series_vals, facets, es,
               mapping):
    field_type = elasticsearch_util.get_field_type(es_field_name, mapping)
    name_arr = es_field_name.split('.')
    if is_time_series or parent_is_time_series:
        # If parent_is_time_series, then time_series_field will be True, so
        # facets_get will add on the time series value to ui_facet_name.
        ui_facet_name = name_arr[-2]
    else:
        ui_facet_name = name_arr[-1]
        if es_field_name.startswith('samples.'):
            ui_facet_name = '%s (samples)' % ui_facet_name

    if es_field_name in facets and is_time_series:
        # Need to remove and re-insert time series items to
        # preserve ordering.
        facets.pop(es_field_name)
    facets[es_field_name] = {
        'ui_facet_name': ui_facet_name,
        'type': field_type,
        # es_field_name could have its own separate facet, could have
        # a panel within a time series facet, or could have
        # both. separate_panel and time_series_panel determine which
        # is the case.
        'time_series_panel': time_series_panel,
        'separate_panel': separate_panel,
        'time_series_field': is_time_series or parent_is_time_series
    }
    if is_time_series or parent_is_time_series:
        facets[es_field_name][
            'description'] = elasticsearch_util.get_field_description(
                es,
                es_field_name.rsplit('.', 1)[0])
    else:
        facets[es_field_name][
            'description'] = elasticsearch_util.get_field_description(
                es, es_field_name)
    facets[es_field_name][
        'es_facet'] = elasticsearch_util.get_elasticsearch_facet(
            es, es_field_name, field_type, time_series_vals)


def _process_extra_facets(es, extra_facets):
    """Processes extra facets and sets current_app.config['EXTRA_FACET_INFO'].

    Args:
      es: Elasticsearch
      extra_facets: List of es_field_name

    Returns:
      A list of es_field_names that don't exist in Elasticsearch index. The
      invalid fields are not included in current_app.config['EXTRA_FACET_INFO']
    """
    if (not extra_facets) or extra_facets == ['']:
        current_app.config['EXTRA_FACET_INFO'] = {}
        return

    facets = OrderedDict()
    mapping = es.indices.get_mapping(index=current_app.config['INDEX_NAME'])
    invalid_extra_facets = []

    for es_base_field_name in extra_facets:
        if not elasticsearch_util.field_exists(es, es_base_field_name):
            invalid_extra_facets.append(es_base_field_name)
            continue

        es_parent_field_name = es_base_field_name.rsplit('.', 1)[0]
        is_time_series = elasticsearch_util.is_time_series(
            es_base_field_name, mapping)
        parent_is_time_series = elasticsearch_util.is_time_series(
            es_parent_field_name, mapping)
        if is_time_series:
            time_series_vals = elasticsearch_util.get_time_series_vals(
                es_base_field_name, mapping)
            es_field_names = [
                es_base_field_name + '.' + tsv for tsv in time_series_vals
            ]
            for es_field_name in es_field_names:
                separate_panel = (es_field_name in facets
                                  and facets[es_field_name]['separate_panel'])
                _add_facet(es_field_name, is_time_series,
                           parent_is_time_series, True, separate_panel,
                           time_series_vals, facets, es, mapping)
        elif parent_is_time_series:
            time_series_vals = elasticsearch_util.get_time_series_vals(
                es_parent_field_name, mapping)
            time_series_panel = (
                es_base_field_name in facets
                and facets[es_base_field_name]['time_series_panel'])
            _add_facet(es_base_field_name, is_time_series,
                       parent_is_time_series, time_series_panel, True,
                       time_series_vals, facets, es, mapping)
        else:
            _add_facet(es_base_field_name, is_time_series,
                       parent_is_time_series, False, True, [], facets, es,
                       mapping)

    # Map that follows same format as FACET_INFO in __main__.py.
    # This map is for extra facets added from the search dropdown.
    # This must be stored separately from FACET_INFO. If this were added to
    # FACET_INFO, then if user deletes extra facets chip, we wouldn't know which
    # facet to remove from FACET_INFO.
    current_app.config['EXTRA_FACET_INFO'] = facets
    return invalid_extra_facets


def _get_time_name(tsv):
    return tsv.replace('_', '.')


def _get_time_series_params(ts_value_names, ts_values):
    """_get_time_series_params
    Converts data in ts_value_names and ts_values into the value_names
    and time_series_value_counts properties of the Facet API.

    ts_value_names is a dictionary mapping value names (such as True
    or '10-19') to numbers by which to sort the value names in the
    array final value_names array.

    ts_values contains a time-indexed array of pairs of arrays giving
    value names and counts, and is converted into the 2-dimensional
    array time_series_value_counts.

    Sample input:
    ts_value_names = {True: -5, False: -7}
    ts_values = [[[True, False], [4, 5]],
                 [[True, False], [1, 0]],
                 [[True, False], [0, 2]]]
    Sample output:
    value_names = [False, True]
    value_counts = [[5, 4],
                    [0, 1],
                    [2, 0]]
    """
    srt = sorted([(ts_value_names[i], i) for i in ts_value_names])
    value_names = [interval for value, interval in srt]
    for i in range(len(srt)):
        value, interval = srt[i]
        ts_value_names[interval] = i
    time_series_value_counts = []
    for entry in ts_values:
        cur_value_names = entry[0]
        cur_value_counts = entry[1]
        entry_array = [0 for name in value_names]
        for i in range(len(cur_value_names)):
            entry_array[ts_value_names[
                cur_value_names[i]]] = cur_value_counts[i]
        time_series_value_counts.append(entry_array)
    return value_names, time_series_value_counts


def _get_facet_values(es_field_name, facet_info, es_response_facets):
    facet = facet_info.get('es_facet')
    value_names = []
    value_counts = []
    for value_name, count, _ in es_response_facets[es_field_name]:
        if elasticsearch_util.is_histogram_facet(facet):
            # For histograms, Elasticsearch returns:
            #   name 10: count 15     (There are 15 people aged 10-19)
            #   name 20: count 33     (There are 33 people aged 20-29)
            # Convert "10" -> "10-19".
            interval_name = elasticsearch_util.number_to_range(
                value_name, _get_bucket_interval(facet))
        else:
            # elasticsearch-dsl returns boolean field keys as 0/1. Use the
            # field's 'type' to convert back to boolean, if necessary.
            if facet_info['type'] == 'boolean':
                interval_name = bool(value_name)
            else:
                interval_name = value_name
        value_names.append(interval_name)
        value_counts.append(count)
    return value_names, value_counts


def _get_time_series_facet(time_series_facets, es_response_facets):
    assert len(time_series_facets) > 0
    es_field_name, facet_info = time_series_facets[0]
    # Initialize variables that are same over all of time_series_facets
    ts_field_name = '.'.join(es_field_name.split('.')[:-1])
    ts_ui_name = facet_info.get('ui_facet_name')
    ts_description = facet_info.get('description')
    ts_field_type = facet_info.get('type')

    ts_time_names = []
    ts_value_names = {}
    ts_values = []
    for es_field_name, facet_info in time_series_facets:
        value_names, value_counts = _get_facet_values(es_field_name,
                                                      facet_info,
                                                      es_response_facets)

        for i in range(len(value_names)):
            # Update ts_value_names to store ordering information for
            # the value names (want to sort by name if the name is
            # numeric, or by count if it is text/boolean).
            if facet_info.get('type') == 'text' or facet_info.get(
                    'type') == 'boolean' or facet_info.get('type') == 'keyword':
                if value_names[i] in ts_value_names:
                    # Subtract to show highest count first.
                    ts_value_names[value_names[i]] -= value_counts[i]
                else:
                    ts_value_names[value_names[i]] = -value_counts[i]
            else:
                ts_value_names[
                    value_names[i]] = elasticsearch_util.range_to_number(
                        value_names[i])

        if not all(count == 0 for count in value_counts):
            ts_time_names.append(_get_time_name(es_field_name.split('.')[-1]))
            ts_values.append([value_names, value_counts])

    value_names, time_series_value_counts = _get_time_series_params(
        ts_value_names, ts_values)
    return Facet(name=ts_ui_name,
                 description=ts_description,
                 es_field_name=ts_field_name,
                 es_field_type=ts_field_type,
                 value_names=value_names,
                 value_counts=[],
                 time_names=ts_time_names,
                 time_series_value_counts=time_series_value_counts)


def _get_histogram_facet(es_field_name, facet_info, es_response_facets):
    name = facet_info.get('ui_facet_name')
    if facet_info.get('time_series_field'):
        tsv = _get_time_name(es_field_name.split('.')[-1])
        if '.' in tsv:
            # The UI displays integer valued times as ints, e.g. 3.0
            # as 3. These conversions produce the same behavior here.
            if int(tsv.split('.')[-1]):
                tsv = float(tsv)
            else:
                tsv = int(float(tsv))
        name = '%s (%s %s)' % (name, current_app.config['TIME_SERIES_UNIT'],
                               tsv)
    value_names, value_counts = _get_facet_values(es_field_name, facet_info,
                                                  es_response_facets)
    return Facet(name=name,
                 description=facet_info.get('description'),
                 es_field_name=es_field_name,
                 es_field_type=facet_info.get('type'),
                 value_names=value_names,
                 value_counts=value_counts,
                 time_names=[],
                 time_series_value_counts=[])


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
    elasticsearch_util.write_tls_crt()
    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'], 
                       http_auth=('elastic', elasticsearch_util.get_kubernetes_password()),
                       use_ssl=True,
                       ca_certs=elasticsearch_util.ES_TLS_CERT_FILE)
    invalid_extra_facets = _process_extra_facets(es, extraFacets)
    combined_facets = (list(current_app.config['EXTRA_FACET_INFO'].items()) +
                       list(current_app.config['FACET_INFO'].items()))
    combined_facets_dict = OrderedDict(combined_facets)

    filter_dict, invalid_filter_facets = elasticsearch_util.get_facet_value_dict(
        es, filter, combined_facets_dict)
    search = DatasetFacetedSearch(filter_dict, combined_facets_dict)
    # Uncomment to print Elasticsearch request python object
    # current_app.logger.info(
    #     'Elasticsearch request: %s' % pprint.pformat(search.build_search().to_dict()))
    es_response = search.execute()
    es_response_facets = es_response.facets.to_dict()
    # Uncomment to print Elasticsearch response python object
    # current_app.logger.info(
    #     'Elasticsearch response: %s' % pprint.pformat(es_response_facets))

    facets = []
    i = 0
    while i < len(combined_facets):
        es_field_name, facet_info = combined_facets[i]
        if facet_info.get('time_series_panel'):
            ts_field_name = '.'.join(es_field_name.split('.')[:-1])
            start = i
            while i < len(combined_facets):
                next_es_field_name, next_facet_info = combined_facets[i]
                next_ts_field_name = '.'.join(
                    next_es_field_name.split('.')[:-1])
                if (next_facet_info.get('time_series_panel')
                        and next_ts_field_name == ts_field_name):
                    if next_facet_info.get('separate_panel'):
                        facets.append(
                            _get_histogram_facet(next_es_field_name,
                                                 next_facet_info,
                                                 es_response_facets))
                    i += 1
                else:
                    break
            facets.append(
                _get_time_series_facet(combined_facets[start:i],
                                       es_response_facets))
        else:
            assert facet_info.get('separate_panel', True)
            i += 1
            facets.append(
                _get_histogram_facet(es_field_name, facet_info,
                                     es_response_facets))

    return FacetsResponse(facets=facets,
                          count=es_response._faceted_search.count(),
                          invalid_filter_facets=invalid_filter_facets,
                          invalid_extra_facets=invalid_extra_facets)
