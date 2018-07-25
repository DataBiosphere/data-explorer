import json
import os

from elasticsearch_dsl import HistogramFacet
from elasticsearch_dsl import TermsFacet
from flask import json
# Elasticsearch uses urllib3 by default, so use urllib3_mock instead of
# requests_mock.
from urllib3_mock import Responses

from data_explorer.controllers import facets_controller
from data_explorer.test.base_test_case import BaseTestCase

responses = Responses('urllib3')


class TestFacetsController(BaseTestCase):
    @classmethod
    def setUpClass(self):
        responses_dir = 'data_explorer/test/mock_responses'

        def _open_resp_file(filename):
            with open(os.path.join(responses_dir, filename)) as f:
                return f.read()

        self.es_basic = _open_resp_file('es_basic.txt')
        self.api_server_facets_basic = _open_resp_file(
            'api_server_facets_basic.txt')
        self.es_histogram = _open_resp_file('es_histogram.txt')
        self.api_server_facets_histogram = _open_resp_file(
            'api_server_facets_histogram.txt')

    def create_app(self):
        app = super(TestFacetsController, self).create_app()
        app.config.update({
            'INDEX_NAME': 'index_name',
            'UI_FACETS': {
                'Region': 'Region description'
            },
            'ELASTICSEARCH_FACETS': {
                'Region': TermsFacet(field='Region.keyword')
            },
            'ELASTICSEARCH_URL': 'fakeurl:9200',
        })
        return app

    @responses.activate
    def test_facets_get(self):
        """Test /facets with basic TermsFacet."""
        responses.add(
            'GET',
            '/index_name/_search',
            body=self.es_basic,
            status=200,
            content_type='application/json')

        response = self.client.get('/facets')
        self.assert200(response)
        self.assertEquals(
            json.loads(self.api_server_facets_basic), response.json)

    @responses.activate
    def test_facets_get_histogram(self):
        """Test facets/ with HistogramFacet.

        For HistogramFacet, Elasticsearch returns facet names "10", "20", etc.
        Test that API server converts these to "10-19", "20-29", etc.
        """
        self.maxDiff = 2000
        self.app.config.update({
            'UI_FACETS': {
                'Age': None
            },
            'ELASTICSEARCH_FACETS': {
                'Age': HistogramFacet(field='Age', interval=10)
            },
        })
        responses.add(
            'GET',
            '/index_name/_search',
            body=self.es_histogram,
            status=200,
            content_type='application/json')

        response = self.client.get('/facets')
        self.assert200(response)
        self.assertEquals(
            json.loads(self.api_server_facets_histogram), response.json)

    def test_number_to_range(self):
        expected = "10 - 19"
        actual = facets_controller._number_to_range(10, 10)
        self.assertEquals(actual, expected)

    def test_number_to_range_less_than_1(self):
        expected = "0.1 - 0.2"
        actual = facets_controller._number_to_range(.1, .1)
        self.assertEquals(actual, expected)

    def test_number_to_range_million(self):
        expected = "10M - 20M"
        actual = facets_controller._number_to_range(10000000, 10000000)
        self.assertEquals(actual, expected)

    def test_range_to_number(self):
        expected = 10
        actual = facets_controller._range_to_number("10 - 19")
        self.assertEquals(actual, expected)

    def test_range_to_number_less_than_1(self):
        expected = 0.1
        actual = facets_controller._range_to_number("0.1 - 0.2")
        self.assertEquals(actual, expected)

    def test_range_to_number_million(self):
        expected = 10000000
        actual = facets_controller._range_to_number("10M - 20M")
        self.assertEquals(actual, expected)


if __name__ == '__main__':
    import unittest
    unittest.main()
