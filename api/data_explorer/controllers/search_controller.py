import re
import time

from data_explorer.models.search_result import SearchResult
from data_explorer.models.search_response import SearchResponse

from flask import current_app
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import MultiMatch


def _results_from_fields_index(fields):
    results = []
    for field in fields['hits']['hits']:
        if "description" in field["_source"]:
            results.append(
                SearchResult(facet_name=field["_source"]["name"],
                             facet_description=field["_source"]["description"],
                             elasticsearch_field_name=field["_id"],
                             facet_value="",
                             is_time_series=False))
        else:
            results.append(
                SearchResult(facet_name=field["_source"]["name"],
                             elasticsearch_field_name=field["_id"],
                             facet_value="",
                             is_time_series=False))
    return results


def _results_from_main_index(fields, query_regex, time_series_stem=''):
    """_results_from_main_index

    Returns dictionary mapping elasticsearch field names from fields
    to pairs containing that field's values that match query_regex,
    and a boolean indicating if the field is a time series
    field. Recursively iterates down fields, an excerpt of which might
    look like:

    {...
        'project-name.dataset_name.table_name.field_a': 5,
        'project-name.dataset_name.table_name.field_b': {
            '_is_time_series': True,
            '0': 3,
            '12': 7,
            '24': 8
        },
    ...
    }

    Above, field_b is a time series field, but field_a is
    not. Therefore when this function recursively iterates on field_b,
    it will have
    time_series_stem='project-name.dataset_name.table_name.field_b' so
    that the child invocation has access to the entire elasticsearch
    field name.
    """
    field_to_facet_values = dict()
    for field_name, field_value in fields.items():
        if isinstance(field_value, dict):
            if '_is_time_series' in field_value and field_value[
                    '_is_time_series']:
                ts_stem = field_name
            else:
                ts_stem = ''
            field_to_facet_values.update(
                _results_from_main_index(field_value, query_regex, ts_stem))
        elif isinstance(field_value, basestring) and re.findall(
                query_regex, field_value.lower()):
            if time_series_stem:
                field_name = time_series_stem + '.' + field_name
                is_time_series = True
            else:
                is_time_series = False
            if field_name in field_to_facet_values:
                field_to_facet_values[field_name].add(
                    (field_value, is_time_series))
            else:
                field_to_facet_values[field_name] = set()
                field_to_facet_values[field_name].add(
                    (field_value, is_time_series))
    return field_to_facet_values


def search_get(query=None):
    """search_get

    Returns searchResults.

    rtype: SearchResponse
    """

    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    search_results = []

    # The number of results that Elasticsearch returns from search queries to
    # the main index.
    # This is low and we'll miss some hits. But it is needed to keep search not
    # take forever for large datasets.
    num_search_results = 100

    # The number of results that Elasticsearch returns from search queries to
    # the fields index. If this is high (like 1000), it makes the
    # UI sluggish (such as initial click in search box).
    num_field_search_results = 100

    if not query:
        # Return all dataset fields, to populate initial search box drop-down.
        # Query fields index.
        fields_search = Search(
            using=es, index=current_app.config['FIELDS_INDEX_NAME']).sort(
                'name.keyword')[0:num_field_search_results]
        fields_search_response = fields_search.execute()
        fields = fields_search_response.to_dict()
        search_results.extend(_results_from_fields_index(fields))
    else:
        # Return only fields matching query.

        # Use MultiMatch to search across all fields. "phrase_prefix" matches
        # with prefix of words in column values.
        multi_match = MultiMatch(query=query, type="phrase_prefix")

        # Part 1: Search fields index. For the BigQuery indexer, this searches
        # BigQuery column name and description.
        fields_search = Search(
            using=es, index=current_app.config['FIELDS_INDEX_NAME']).query(
                multi_match)[0:num_field_search_results]
        fields_search_response = fields_search.execute()
        fields = fields_search_response.to_dict()
        search_results.extend(_results_from_fields_index(fields))

        # Part 2: Search main index. For the BigQuery indexer, this searches
        # BigQuery column values.
        # Store the query matches in a dict of es_field_name to a set of facet
        # values.
        field_to_facet_values = dict()

        search = Search(
            using=es,
            index=current_app.config['INDEX_NAME']).query(multi_match).params(
                request_timeout=30)[0:num_search_results]

        begin = time.time()
        response = search.execute()
        end = time.time()
        current_app.logger.info("Elasticsearch query: %s sec" % (end - begin))
        response_fields = response.to_dict()

        # This regex matches if there is a word that starts with query,
        # or a word that contains underscore_query.
        query_regex = r"\b{query}\w*|_{query}\w*".format(
            query=re.escape(query.lower()))

        # hits contains entire documents. Iterate over the fields to figure out
        # which field matched query.
        # Elasticsearch highlight can do this for us, but it makes the search
        # too slow, so do it ourselves.
        # See https://github.com/elastic/elasticsearch/issues/36452

        begin = time.time()
        for hit in response_fields['hits']['hits']:
            results = _results_from_main_index(hit['_source'], query_regex)
            for key in results:
                if key in field_to_facet_values:
                    field_to_facet_values[key].update(results[key])
                else:
                    field_to_facet_values[key] = results[key]
        end = time.time()
        current_app.logger.info("Post-processing: %s sec" % (end - begin))

        for es_field_name in field_to_facet_values:
            for facet_value, is_time_series in field_to_facet_values[
                    es_field_name]:
                search_results.append(
                    SearchResult(elasticsearch_field_name=es_field_name,
                                 facet_name=(es_field_name.split('.')[-2]
                                             if is_time_series else
                                             es_field_name.split('.')[-1]),
                                 facet_value=facet_value,
                                 is_time_series=is_time_series))

    return SearchResponse(search_results=search_results)
