import json

from elasticsearch_dsl import TermsFacet
from flask import json
# Elasticsearch uses urllib3 by default, so use urllib3_mock instead of
# requests_mock.
from urllib3_mock import Responses

from data_explorer.test.base_test_case import BaseTestCase


responses = Responses('urllib3')

class TestFacetsController(BaseTestCase):
    """ FacetsController integration test stubs """

    es_faceted_search_response = """
{
  "took": 2,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 1338,
    "max_score": 0,
    "hits": []
  },
  "aggregations": {
    "_filter_Region": {
      "doc_count": 1338,
      "Region": {
        "doc_count_error_upper_bound": 0,
        "sum_other_doc_count": 0,
        "buckets": [
          {
            "key": "southeast",
            "doc_count": 364
          },
          {
            "key": "northwest",
            "doc_count": 325
          },
          {
            "key": "southwest",
            "doc_count": 325
          },
          {
            "key": "northeast",
            "doc_count": 324
          }
        ]
      }
    }
  }
}
    """
    data_explorer_facets_response = """
{  
   "count":1338,
   "facets":[  
      {  
         "name":"Region",
         "values":[  
            {  
               "count":364,
               "name":"southeast"
            },
            {  
               "count":325,
               "name":"northwest"
            },
            {  
               "count":325,
               "name":"southwest"
            },
            {  
               "count":324,
               "name":"northeast"
            }
         ]
      }
   ]
}
"""
    def create_app(self):
        app = super(TestFacetsController, self).create_app()
        app.config.update({
            'INDEX_NAME': 'index_name',
            'ELASTICSEARCH_FACETS': {'Region': TermsFacet(field='Region.keyword')},
            'ELASTICSEARCH_URL': 'fakeurl:9200',
        })
        return app

    @responses.activate
    def test_facets_get(self):
        """Test case for facets_get"""
        responses.add('GET', '/index_name/_search',
                  body=self.es_faceted_search_response, status=200,
                  content_type='application/json')

        response = self.client.get('/facets')
        self.assert200(response)
        self.assertEquals(json.loads(self.data_explorer_facets_response), response.json)


if __name__ == '__main__':
    import unittest
    unittest.main()
