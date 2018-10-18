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
            'FACET_INFO': {
                'Region name': {
                    'description': 'Region description',
                    'type': 'text',
                    'ui_facet_name': 'Region',
                    'es_facet': TermsFacet(field='Region.keyword')
                }
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
            'FACET_INFO': {
                'Age name': {
                    'type': 'text',
                    'ui_facet_name': 'Age',
                    'es_facet': HistogramFacet(field='Age', interval=10)
                }
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
        def _inner(interval_start, interval, expected_range):
            actual_range = facets_controller._number_to_range(
                interval_start, interval)
            self.assertEquals(actual_range, expected_range)

        _inner(.1, .1, '0.1-0.2')
        _inner(1, 1, '1')
        _inner(10, 10, '10-20')
        _inner(10000000, 10000000, '10M-20M')


if __name__ == '__main__':
    import unittest
    unittest.main()
