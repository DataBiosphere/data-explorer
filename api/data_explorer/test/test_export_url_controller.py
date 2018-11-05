import json
import os

from elasticsearch_dsl import TermsFacet
# Elasticsearch uses urllib3 by default, so use urllib3_mock instead of
# requests_mock.
from urllib3_mock import Responses

from data_explorer.test.base_test_case import BaseTestCase

responses = Responses('urllib3')


class TestExportUrlController(BaseTestCase):
    """ExportUrlController integration test stubs"""

    @classmethod
    def setUpClass(self):
        responses_dir = 'data_explorer/test/mock_responses'

        def _open_resp_file(filename):
            with open(os.path.join(responses_dir, filename)) as f:
                return f.read()

        self.es_response = _open_resp_file('es_histogram.txt')

    def create_app(self):
        app = super(TestExportUrlController, self).create_app()
        app.config.update({
            'DATASET_CONFIG_DIR':
            '../dataset_config/1000_genomes',
            'DEPLOY_PROJECT_ID':
            'project_id',
            'EXPORT_URL_GCS_BUCKET':
            'bucket',
            'TABLES': {
                'project_id.dataset_id.table_name': 'description'
            },
            'PARTICIPANT_ID_COLUMN':
            'primary_key',
            'SAMPLE_FILE_COLUMNS': {
                'Chr 1 VCF': 'project_id.dataset_id.table_name.sample_type',
            },
            'INDEX_NAME':
            'index_name',
            'FACET_INFO': {
                'project_id.dataset_id.table_name.age': {
                    'type': 'text',
                    'ui_facet_name': 'Age',
                    'es_facet': TermsFacet(field='Age.keyword')
                },
                'samples.project_id.dataset_id.table_name.sample_type': {
                    'type': 'boolean',
                    'ui_facet_name': 'Has Chr 1 VCF (samples)',
                    'es_facet': TermsFacet(field='samples._has_chr1_vcf')
                }
            },
            'EXTRA_FACET_INFO': {},
            'ELASTICSEARCH_URL':
            'fakeurl:9200',
            'SAMPLE_ID_COLUMN': 'sample_id',
        })
        return app

    @responses.activate
    def test_export_url_post(self):
        responses.add(
            'GET',
            '/index_name/_search',
            body=self.es_response,
            status=200,
            content_type='application/json')

        response = self.client.post(
            '/exportUrl',
            data=json.dumps({
                'cohortName':
                'test',
                'filter': [
                    'project_id.dataset_id.table_name.age=34',
                    'samples.project_id.dataset_id.table_name.sample_type=True'
                ]
            }),
            content_type='application/json')
        self.assert200(response)


if __name__ == '__main__':
    import unittest
    unittest.main()
