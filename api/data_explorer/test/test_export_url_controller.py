import json

from data_explorer.test.base_test_case import BaseTestCase


class TestExportUrlController(BaseTestCase):
    """ExportUrlController integration test stubs"""

    def create_app(self):
        app = super(TestExportUrlController, self).create_app()
        app.config.update({
            'DATASET_CONFIG_DIR':
            '../dataset_config/1000_genomes',
            'EXPORT_URL_GCS_BUCKET':
            'bucket',
            'TABLE_NAMES': ['project_id.dataset_id.table_name']
        })
        return app

    def test_export_url_post(self):
        response = self.client.post('/exportUrl')
        self.assert200(response)


if __name__ == '__main__':
    import unittest
    unittest.main()
