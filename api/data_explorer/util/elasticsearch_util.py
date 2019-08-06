import json
import urllib
import math

from elasticsearch import helpers
from elasticsearch_dsl import Search
from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import TermsFacet
from elasticsearch_dsl.aggs import Cardinality
from elasticsearch_dsl.aggs import Max
from elasticsearch_dsl.aggs import Min
from elasticsearch_dsl.aggs import Nested
# TODO(bryancrampton): Remove '.faceted_search' once
# https://github.com/elastic/elasticsearch-dsl-py/pull/976 is included in a
# release (6.2.2)
from elasticsearch_dsl.faceted_search import NestedFacet
from elasticsearch_dsl.query import Match
from filters_facet import FiltersFacet

from flask import current_app


def _get_metrics(es, field_name):
    search = Search(using=es, index=current_app.config['INDEX_NAME'])
    # Traverse down the nesting levels from the root field, until we reach the leaf.
    # Need to traverse until the root, because we have to build the search object
    # by adding Nested aggregations consecutively. For example, a nested "samples.foo"
    # field will result in:
    # Search(...).bucket('samples', Nested(path='samples')).metric(...)
    parts = field_name.split('.')
    bucket = search.aggs
    parent = ''
    nestings = []
    for part in parts:
        parent = '%s.%s' % (parent, part) if parent else part
        if parent in current_app.config['NESTED_PATHS']:
            bucket = bucket.bucket(parent, Nested(path=parent))
            nestings.append(parent)

    bucket.metric('max', Max(field=field_name))
    bucket.metric('min', Min(field=field_name))
    bucket.metric('cardinality', Cardinality(field=field_name))

    aggs = search.params(size=0).execute().aggregations.to_dict()
    for nesting in nestings:
        aggs = aggs.get(nesting)

    return (aggs['min']['value'], aggs['max']['value'],
            aggs['cardinality']['value'])


def _get_field_range_and_cardinality(es, field_name, time_series_vals):
    if time_series_vals:
        all_metrics = [
            _get_metrics(es, "%s.%s" % (field_name, tsv))
            for tsv in time_series_vals
        ]
        total_max = max(m[1] for m in all_metrics)
        total_card = max(m[2] for m in all_metrics)
        if total_max != None:
            total_min = min(m[0] for m in all_metrics if m[0] != None)
        else:
            total_min = None
    else:
        total_min, total_max, total_card = _get_metrics(es, field_name)
    if total_max:
        field_range = total_max - total_min
    else:
        field_range = 0

    return (field_range, total_card)


def get_bucket_interval(es, field_name, time_series_vals):
    field_range, cardinality = _get_field_range_and_cardinality(
        es, field_name, time_series_vals)
    if field_range < 1:
        return .1
    elif field_range == 1 and cardinality > 2:
        return .1
    elif field_range == 1 and cardinality == 2:
        # Some datasets have (0, 1) instead of booleans. Return 1 for that case
        # instead of .1.
        return 1
    elif field_range < 8:
        return 1
    elif field_range < 20:
        return 2
    elif field_range < 150:
        # Make the ranges easy to read (10-19,20-29 instead of 10-17,18-25).
        return 10
    elif field_range < 300:
        return 20
    elif field_range < 800:
        return 50
    elif field_range < 1500:
        return 100
    elif field_range < 15000:
        return 1000
    elif field_range < 150000:
        return 10000
    elif field_range < 1500000:
        return 100000
    elif field_range < 15000000:
        return 1000000
    elif field_range < 150000000:
        return 10000000
    elif field_range < 1500000000:
        return 100000000
    elif field_range < 15000000000:
        return 1000000000
    elif field_range < 150000000000:
        return 10000000000
    elif field_range < 1500000000000:
        return 100000000000
    else:
        return 1000000000000


def range_to_number(interval_str):
    """Converts "X-Y" -> "X"."""
    if not '-' in interval_str:
        return int(interval_str)

    # If first character is -, X is a negative number
    if interval_str.startswith('-'):
        number = '-' + interval_str.split('-')[1]
    else:
        number = interval_str.split('-')[0]

    if number[-1] == 'M':
        return int(round(float(number[:-1]) * 1000000))
    elif number[-1] == 'B':
        return int(round(float(number[:-1]) * 1000000000))
    elif '.' in number:
        return float(number)
    else:
        return int(number)


def number_to_range(interval_start, interval):
    """Converts "X" -> "X-Y"."""
    if interval < 1:
        # Return something like "0.1-0.2"
        return '%s-%s' % (interval_start, interval_start + interval)
    elif interval == 1:
        # Return something like "5"
        return '%d' % interval_start
    elif interval < 1000000:
        # Return something like "10-19"
        return '%d-%d' % (interval_start, interval_start + interval - 1)
    elif interval == 1000000:
        # Return something like "1.0M-1.9M"
        return '%d.0M-%d.9M' % (interval_start / 1000000,
                                interval_start / 1000000)
    elif interval < 1000000000:
        # Return something like "10M-19M"
        return '%dM-%dM' % (interval_start / 1000000,
                            (interval_start + interval - 1) / 1000000)
    elif interval == 1000000000:
        # Return something like "1.0B-1.9B"
        return '%d.0B-%d.9B' % (interval_start / 1000000000,
                                interval_start / 1000000000)
    else:
        # Return something like "10B-19B"
        return '%dB-%dB' % (interval_start / 1000000000,
                            (interval_start + interval - 1) / 1000000000)


def convert_to_index_name(s):
    """Converts a string to an Elasticsearch index name."""
    # For Elasticsearch index name restrictions, see
    # https://github.com/DataBiosphere/data-explorer-indexers/issues/5#issue-308168951
    # Elasticsearch allows single quote in index names. However, they cause other
    # problems. For example,
    # "curl -XDELETE http://localhost:9200/nurse's_health_study" doesn't work.
    # So also remove single quotes.
    prohibited_chars = [
        ' ', '"', '*', '\\', '<', '|', ',', '>', '/', '?', '\''
    ]
    for char in prohibited_chars:
        s = s.replace(char, '_')
    s = s.lower()
    # Remove leading underscore.
    if s.find('_', 0, 1) == 0:
        s = s.lstrip('_')
    print('Index name: %s' % s)
    return s


def get_facet_value_dict(filter_arr, facets):
    """
    Parses an array of filters and es facets into a dict of facet_name:[facet_value]
    mappings.
    """
    if not filter_arr or filter_arr == [""]:
        return {}
    parsed_filter = {}
    for facet_filter in filter_arr:
        filter_str = urllib.unquote(facet_filter).decode('utf8')
        key_val = filter_str.split('=')
        name = key_val[0]
        es_facet = facets[name]['es_facet']
        if is_histogram_facet(es_facet):
            value = range_to_number(key_val[1])
        else:
            value = key_val[1]

        if not name in parsed_filter:
            parsed_filter[name] = [value]
        else:
            parsed_filter[name].append(value)
    return parsed_filter


def get_field_description(es, field_name):
    s = Search(using=es, index=current_app.config['INDEX_NAME'] + '_fields')
    s.update_from_dict(
        {"query": {
            "bool": {
                "must": [{
                    "match": {
                        "_id": field_name
                    }
                }]
            }
        }})
    hits = s.execute()['hits']['hits']
    if len(hits) == 0:
        raise ValueError(
            'elasticsearch_field_name %s not found in Elasticsearch index %s' %
            (field_name, current_app.config['INDEX_NAME'] + '_fields'))
    if 'description' in hits[0]['_source']:
        return hits[0]['_source']['description']
    return ''


def get_field_type(es, field_name, mapping):
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['type']['properties']
    for subname in field_name.split('.')[:-1]:
        submapping = submapping[subname]['properties']
    submapping = submapping[field_name.split('.')[-1]]
    return submapping['type']


def is_time_series(es, field_name, mapping):
    """Returns true iff field_name has time series data.
    """
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['type']['properties']
    for subname in field_name.split('.')[:-1]:
        submapping = submapping[subname]['properties']
    submapping = submapping[field_name.split('.')[-1]]
    return ('properties' in submapping
            and '_is_time_series' in submapping['properties'])


def get_time_series_vals(es, field_name, mapping):
    """Returns a sorted array of the times at which field_name could have
    data.
    """
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['type']['properties']
    for subname in field_name.split('.'):
        submapping = submapping[subname]['properties']
    time_series_vals = submapping.keys()
    assert '_is_time_series' in time_series_vals
    time_series_vals.remove('_is_time_series')
    has_unknown = 'Unknown' in time_series_vals
    if has_unknown:
        time_series_vals.remove('Unknown')
    if '_' in time_series_vals[0]:
        # time_series_vals contains floats, which have been stored in
        # elasticsearch with '_' replacing '.'
        time_series_vals = sorted(
            [float(tsv.replace('_', '.')) for tsv in time_series_vals])
        time_series_vals = [
            str(tsv).replace('.', '_') for tsv in time_series_vals
        ]
    else:
        # time_series_vals contains ints
        time_series_vals = map(str, sorted(map(int, time_series_vals)))
    if has_unknown:
        time_series_vals.append('Unknown')
    return time_series_vals


def _get_nested_paths_inner(prefix, mappings):
    nested_field_paths = []
    for field_name, field in mappings.items():
        nested_path = field_name
        if prefix:
            nested_path = '%s.%s' % (prefix, field_name)
        if 'type' in field and field['type'] == 'nested':
            nested_field_paths.append(nested_path)
        if 'properties' in field:
            nested_field_paths.extend(
                _get_nested_paths_inner(nested_path, field['properties']))
    return nested_field_paths


# TODO: After we are using elasticsearch-dsl version with
# https://github.com/elastic/elasticsearch-dsl-py/commit/845a2d6bc606e79d36fcebccca64a269ff10984e,
# delete this method and current_app.config['NESTED_PATHS']. Instead of using
# current_app.config['NESTED_PATHS'], use index.resolve_nested() instead.
def get_nested_paths(es):
    """
    Returns nested paths, which can be used to created NestedFacet's.

    When performing faceted search on nested fields within a document, NestedFacet must be used.
    See https://elasticsearch-dsl.readthedocs.io/en/latest/faceted_search.html?highlight=nestedfacet#configuration

    The first argument to NestedFacet is a path to the nested field. For example, the 1000 Genomes index has
    one nested path: "samples". See https://github.com/DataBiosphere/data-explorer-indexers#main-dataset-index

    This method crawls through index mappings and returns all nested paths.
    """
    nested_paths = []
    mappings = es.indices.get_mapping(index=current_app.config['INDEX_NAME'])
    nested_paths.extend(
        _get_nested_paths_inner(
            '', mappings[current_app.config['INDEX_NAME']]['mappings']['type']
            ['properties']))
    return nested_paths


def _maybe_get_nested_facet(elasticsearch_field_name, es_facet):
    """
    Returns a NestedFacet for the Elasticsearch field, if the field is nested.

    Note there can be multiple levels of NestedFacet,
    eg NestedFacet(outer, NestedFacet(inner, es_facet))
    """
    parts = elasticsearch_field_name.rsplit('.', 1)
    # Traverse up the nesting levels from the leaf field, until we reach the root.
    # Need to traverse until the root, because the root can be a nested field,
    # for example "samples". All the sub fields can be non-nested, like
    # "samples.verily-public-data.human_genome_variants.1000_genomes_sample_info.Main_project_LC_platform"
    # This field needs to be a NestedFacet because an ancestor("samples") is nested.
    while len(parts) > 1:
        parent = parts[0]
        if parent in current_app.config['NESTED_PATHS']:
            es_facet = NestedFacet(parent, es_facet)
        parts = parent.rsplit('.', 1)

    return es_facet


def get_elasticsearch_facet(es, elasticsearch_field_name, field_type,
                            time_series_vals):
    if field_type == 'text':
        # Use ".keyword" because we want aggregation on keyword field, not
        # term field. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/fielddata.html#before-enabling-fielddata
        es_facet = TermsFacet(
            field=elasticsearch_field_name + '.keyword',
            size=1000)  # TODO we will need to use paging if >1000
    elif field_type == 'boolean':
        es_facet = TermsFacet(field=elasticsearch_field_name)
    else:
        # Assume numeric type.
        if time_series_vals:
            es_base_field_name = elasticsearch_field_name.rsplit('.', 1)[0]
        else:
            es_base_field_name = elasticsearch_field_name
        interval = get_bucket_interval(es, es_base_field_name,
                                       time_series_vals)
        # TODO: When https://github.com/elastic/elasticsearch/issues/31828
        # is fixed, use AutoHistogramFacet instead.
        es_facet = HistogramFacet(field=elasticsearch_field_name,
                                  interval=interval)

    nested_facet = _maybe_get_nested_facet(elasticsearch_field_name, es_facet)
    if nested_facet:
        es_facet = nested_facet
    return es_facet


def get_samples_overview_facet(es_field_names):
    filters = {
        facet: Match(**{field: True})
        for facet, field in es_field_names.iteritems()
    }
    return NestedFacet('samples', FiltersFacet(filters))


def is_histogram_facet(facet):
    if isinstance(facet, HistogramFacet):
        return True
    # For some reason using isinstance doesn't work here for
    # NestedFacet. I believe it's due to the absolute path,
    # it may work once NestedFacet is exported as part of
    # elasticsearch_dsl.
    elif hasattr(facet, '_inner'):
        return is_histogram_facet(facet._inner)


def _delete_index(es, index):
    try:
        es.indices.delete(index=index)
    except Exception as e:
        # Sometimes delete fails even though index exists. Add logging to help
        # debug.
        current_app.logger.info('Deleting %s index failed: %s' % (index, e))
        # Ignore 404: index not found
        index = es.indices.get(index=index, ignore=404)
        current_app.logger.info('es.indices.get(index=%s): %s' %
                                (index, index))


def _create_index(es, index, mappings_file=None):
    if mappings_file:
        with open(mappings_file) as f:
            mappings = json.loads(f.next())
        es.indices.create(index=index, body=mappings)
    else:
        es.indices.create(index=index)


def load_index_from_json(es, index, index_file, mappings_file=None):
    """Load index from index.json.

    Input must be JSON, not CSV. Unlike JSON, CSV values don't have types, so
    numbers would be indexed as strings. (And there is no easy way in Python to
    detect the type of a string.)
    """
    current_app.logger.info('Loading %s index from JSON cache.' % index)
    _delete_index(es, index)
    _create_index(es, index, mappings_file)
    actions = []
    with open(index_file) as f:
        for line in f:
            # Each line contains a JSON document. See
            # https://github.com/taskrabbit/elasticsearch-dump#dump-format
            record = json.loads(line)
            action = {
                '_id': record['_id'],
                '_index': index,
                '_type': 'type',
                '_source': record['_source'],
            }
            actions.append(action)
    helpers.bulk(es, actions)
