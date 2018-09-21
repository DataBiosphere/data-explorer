import json

from data_explorer.test.base_test_case import BaseTestCase


class TestExportUrlController(BaseTestCase):
    """ExportUrlController integration test stubs"""

    def create_app(self):
        app = super(TestExportUrlController, self).create_app()
        app.config.update({
            'DATASET_CONFIG_DIR':
            '../dataset_config/1000_genomes',
            'DEPLOY_PROJECT_ID':
            'project_id',
            'EXPORT_URL_GCS_BUCKET':
            'bucket',
            'TABLE_NAMES': ['project_id.dataset_id.table_name'],
            'PARTICIPANT_ID_COLUMN':
            'primary_key',
            'SAMPLE_FILE_COLUMNS': {
                'Chr 1 VCF': 'project_id.dataset_id.table_name.sample_type',
            },
            'UI_FACETS': {
                'Age': {
                    'type':
                    'text',
                    'elasticsearch_field_name':
                    'project_id.dataset_id.table_name.age'
                },
                'Has Chr 1 VCF (samples)': {
                    'type':
                    'boolean',
                    'elasticsearch_field_name':
                    'samples.project_id.dataset_id.table_name.sample_type'
                }
            }
        })
        return app

    def test_export_url_post(self):
        response = self.client.post(
            '/exportUrl',
            data=json.dumps({
                'cohortName':
                'test',
                'filter': ['Age=34', 'Has Chr 1 VCF (samples)=True']
            }),
            content_type='application/json')
        self.assert200(response)


if __name__ == '__main__':
    import unittest
    unittest.main()
