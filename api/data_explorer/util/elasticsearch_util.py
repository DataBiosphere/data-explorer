import json
import math
import urllib.parse

from google.cloud import container_v1
import google.auth
import google.auth.transport.requests
import kubernetes
from tempfile import NamedTemporaryFile
import base64

from elasticsearch import helpers, NotFoundError
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
from .filters_facet import FiltersFacet

from flask import current_app

ES_TLS_CERT_FILE = "/tmp/tls.crt"

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
        return '%.1f-%.1f' % (interval_start, interval_start + interval)
    elif interval == 1:
        # Return something like "5"
        return '%d' % interval_start
    elif interval < 1000000:
        # Return something like "10-19"
        return '%d-%d' % (interval_start, interval_start + interval - 1)
    elif interval == 1000000:
        # Return something like "1.0M-1.9M"
        return '%d.0M-%d.9M' % (interval_start // 1000000,
                                interval_start // 1000000)
    elif interval < 1000000000:
        # Return something like "10M-19M"
        return '%dM-%dM' % (interval_start // 1000000,
                            (interval_start + interval - 1) // 1000000)
    elif interval == 1000000000:
        # Return something like "1.0B-1.9B"
        return '%d.0B-%d.9B' % (interval_start // 1000000000,
                                interval_start // 1000000000)
    else:
        # Return something like "10B-19B"
        return '%dB-%dB' % (interval_start // 1000000000,
                            (interval_start + interval - 1) // 1000000000)


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


def get_facet_value_dict(es, filters, facets):
    """
    Parses filters and facets into a dict from es_field_name to list of facet values.

    Args:
      es: Elasticsearch
      filters: List of filter params, where each param has the format
        es_field_name=facet_value
      facets: A dict of facet info's. For facet info structure, see
        app.app.config['FACET_INFO'] in __main__.py

    Returns:
      1. Dict from es_field_name to list of facet values
      2. List of es_field_name that don't exist in Elasticsearch index. These
         invalid fields are not in above dict.
    """
    invalid_filter_facets = []
    if not filters or filters == [""]:
        return {}, invalid_filter_facets

    filter_dict = {}
    for facet_filter in filters:
        filter_str = urllib.parse.unquote(facet_filter)
        facet_name_value = filter_str.rsplit('=', 1)
        es_field_name = facet_name_value[0]
        facet_value = facet_name_value[1]

        if es_field_name != 'Samples Overview' and not field_exists(
                es, es_field_name):
            invalid_filter_facets.append(es_field_name)
            continue

        if is_histogram_facet(facets[es_field_name]['es_facet']):
            facet_value = range_to_number(facet_value)

        if not es_field_name in filter_dict:
            filter_dict[es_field_name] = [facet_value]
        else:
            filter_dict[es_field_name].append(facet_value)
    return filter_dict, invalid_filter_facets


def field_exists(es, field_name):
    try:
        es.get(index=current_app.config['FIELDS_INDEX_NAME'],
               id=field_name)
    except NotFoundError:
        # Time series field_name looks like
        # verily-public-data.framingham_heart_study_teaching.framingham_heart_study_teaching.AGE.1
        # Remove the ".1" and try again
        field_name = field_name.rsplit('.', 1)[0]
        try:
            es.get(index=current_app.config['FIELDS_INDEX_NAME'],
                   id=field_name)
        except NotFoundError:
            return False
        return True
    return True


def get_field_description(es, field_name):
    s = Search(using=es, index=current_app.config['FIELDS_INDEX_NAME'])
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
            (field_name, current_app.config['FIELDS_INDEX_NAME']))

    dataset = field_name.split('.')[1]
    table = field_name.split('.')[2]
    description = 'Dataset {}, table {}'.format(dataset, table)
    if 'description' in hits[0]['_source']:
        description += ': {}'.format(hits[0]['_source']['description'])
    return description


def get_field_type(field_name, mapping):
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['properties']
    for subname in field_name.split('.')[:-1]:
        submapping = submapping[subname]['properties']
    submapping = submapping[field_name.split('.')[-1]]
    return submapping['type']


def is_time_series(field_name, mapping):
    """Returns true iff field_name has time series data.
    """
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['properties']
    for subname in field_name.split('.')[:-1]:
        submapping = submapping[subname]['properties']
    submapping = submapping[field_name.split('.')[-1]]
    return ('properties' in submapping
            and '_is_time_series' in submapping['properties'])


def get_time_series_vals(field_name, mapping):
    """Returns a sorted array of the times at which field_name could have
    data.
    """
    submapping = mapping[
        current_app.config['INDEX_NAME']]['mappings']['properties']
    for subname in field_name.split('.'):
        submapping = submapping[subname]['properties']
    time_series_vals = list(submapping.keys())
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
        time_series_vals = list(map(str, sorted(map(int, time_series_vals))))
    if has_unknown:
        time_series_vals.append('Unknown')
    return time_series_vals


def _get_nested_paths_inner(prefix, mappings):
    nested_field_paths = []
    for field_name, field in list(mappings.items()):
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
            '', mappings[current_app.config['INDEX_NAME']]['mappings']
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
    if field_type == 'text' or field_type == 'keyword':
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
        for facet, field in es_field_names.items()
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
            mappings = json.loads(next(f))
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
                '_source': record['_source'],
            }
            actions.append(action)
    helpers.bulk(es, actions)

def _get_kubernetes_client_config():
    current_app.logger.info('Attempting to init k8s client from cluster response')
    
    project_id = current_app.config['DEPLOY_PROJECT_ID']
    current_app.logger.info(project_id)
    zone = 'us-central1-f'  # TODO(willyn): Read from config
    cluster_id = 'ukb-data-explorer-test'   # TODO(willyn): Read from config
    container_client = container_v1.ClusterManagerClient()
    current_app.logger.info('Created container client')
    response = container_client.get_cluster(project_id, zone, cluster_id)
    current_app.logger.info('Succesfully got cluster')
    creds, projects = google.auth.default()
    current_app.logger.info('Succesfully got default auth creds')
    auth_req = google.auth.transport.requests.Request()
    current_app.logger.info('Succesfully made auth request')
    creds.refresh(auth_req)
    current_app.logger.info('Succesfully refreshed creds')

    current_app.logger.info('Succesfully authorized with k8s cluster')
    
    configuration = kubernetes.client.Configuration()
    configuration.host = 'https://{}'.format(response.endpoint)
    with NamedTemporaryFile(delete=False) as ca_cert:
        ca_cert.write(
            base64.b64decode(response.master_auth.cluster_ca_certificate))
    configuration.ssl_ca_cert = ca_cert.name
    configuration.api_key_prefix['authorization'] = 'Bearer'
    configuration.api_key['authorization'] = creds.token
    return configuration

def get_kubernetes_password():
    # Execute the equivalent of:
    #   kubectl get secret quickstart-es-elastic-user \
    #     -o go-template='{{.data.elastic | base64decode }}'
    configuration = _get_kubernetes_client_config()
    v1 = kubernetes.client.CoreV1Api(kubernetes.client.ApiClient(configuration))
    #kubernetes.config.load_kube_config()
    #v1 = kubernetes.client.CoreV1Api()
    secret_dict = v1.read_namespaced_secret("elasticsearch-es-elastic-user", "default").data
    return base64.b64decode(secret_dict['elastic']).decode('ascii')

def write_tls_crt():
    # Execute the equivalent of:
    #   kubectl get secret "quickstart-es-http-certs-public" \
    #     -o go-template='{{index .data "tls.crt" | base64decode }}' \
    #     > /tmp/tls.crt
    configuration = _get_kubernetes_client_config()
    v1 = kubernetes.client.CoreV1Api(kubernetes.client.ApiClient(configuration))
    #kubernetes.config.load_kube_config()
    #v1 = kubernetes.client.CoreV1Api()
    secret_dict = v1.read_namespaced_secret("elasticsearch-es-http-certs-public", "default").data
    with open(ES_TLS_CERT_FILE, "wb") as f:
      f.write(base64.b64decode(secret_dict['tls.crt']))