
from elasticsearch_dsl import Search

from flask import current_app

def get_field_type(es, field_name):
    # elasticsearch_dsl.Mapping, which gets mappings for all fields, would be
    # easier, but we can't use it.
    # BigQuery indexer uses field names like "project.dataset.table.column".
    # elasticsearch_dsl.Mapping corresponds to
    # "curl /index/_mapping/doc_type". That returns a nested dict:
    #   "project":
    #     "dataset":
    #       ...
    # It's difficult to retrieve type from the nested dict.
    # Instead, we get the type for one field:
    # "curl /index/_mapping/doc_type/project.dataset.table.column".
    # This has the benefit that we can support Elasticsearch documents that are
    # truly nested, such as HCA Orange Box. elasticsearch_field_name in ui.json
    # would be "parent.child".
    mapping = es.indices.get_field_mapping(
        fields=field_name, index=current_app.config['INDEX_NAME'], doc_type='type')
    if mapping == {}:
        raise ValueError(
            'elasticsearch_field_name %s not found in Elasticsearch index %s' %
            (field_name, current_app.config['INDEX_NAME']))

    # If field_name is "a.b.c", last_part is "c".
    last_part = field_name.split('.')[len(field_name.split('.')) - 1]
    return mapping[current_app.config['INDEX_NAME']]['mappings']['type'][
        field_name]['mapping'][last_part]['type']


def _get_field_min_max_agg(es, field_name):
    return Search(
        using=es, index=current_app.config['INDEX_NAME']
    ).aggs.metric(
        'max',
        'max',
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        field=field_name
    ).params(size=0).aggs.metric(
        'min',
        'min',
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        field=field_name).params(size=0).execute()


# TODO(bfcrampton): Generalize this for any nested field
def _get_samples_field_min_max_agg(es, field_name):
    search = Search(using=es, index=current_app.config['INDEX_NAME'])
    search.update_from_dict({
        "aggs": {
            "parent": {
                "nested": {
                    "path": "samples"
                },
                "aggs": {
                    "max": {
                        "max": {
                            "field": field_name
                        }
                    },
                    "min": {
                        "min": {
                            "field": field_name
                        }
                    }
                }
            }
        }
    })
    return search.params(size=0).execute()


def get_field_range(es, field_name):
    if field_name.startswith('samples.'):
        response = _get_samples_field_min_max_agg(es, field_name)
    else:
        response = _get_field_min_max_agg(es, field_name)
    return (response.aggregations.parent['max']['value'] -
            response.aggregations.parent['min']['value'])


def get_bucket_interval(field_range):
    if field_range <= 1:
        return .1
    if field_range < 8:
        return 1
    elif field_range < 20:
        return 2
    elif field_range < 150:
        # Make the ranges easy to read (10-19,20-29 instead of 10-17,18-25).
        return 10
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
