from data_explorer.models.search_result import SearchResult
from data_explorer.models.search_response import SearchResponse

from flask import current_app
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search


def search_get():
    """search_get

    Returns searchResults.

    rtype: SearchResponse
    """

    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    search = Search(using=es, index=current_app.config['FIELDS_INDEX_NAME'])
    # TODO(malathir): Change this to case insensitive sorting.
    search = search.sort('name.keyword')
    # Default number of results is 10, which isn't enough.
    search = search[0:10000]
    response = search.execute()
    response_fields = response.to_dict()

    search_results = []
    for field in response_fields['hits']['hits']:
        if "description" in field["_source"]:
            search_results.append(
                SearchResult(
                    facet_name=field["_source"]["name"],
                    facet_description=field["_source"]["description"],
                    elasticsearch_field_name=field["_id"],
                    facet_value=""))
        else:
            search_results.append(
                SearchResult(
                    facet_name=field["_source"]["name"],
                    elasticsearch_field_name=field["_id"],
                    facet_value=""))

    return SearchResponse(search_results=search_results)
