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

    fields = []
    for field in response_fields['hits']['hits']:
        if "description" in field["_source"]:
            fields.append(
                SearchResult(
                    name=field["_source"]["name"],
                    elasticsearch_name=field["_id"],
                    description=field["_source"]["description"]))
        else:
            fields.append(
                SearchResult(
                    name=field["_source"]["name"],
                    elasticsearch_name=field["_id"]))

    return SearchResponse(fields=fields)
