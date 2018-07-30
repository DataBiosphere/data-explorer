import json

from data_explorer.test.base_test_case import BaseTestCase

dataset_name = 'Test data'


class TestExportUrlController(BaseTestCase):
    """ExportUrlController integration test stubs"""

    def create_app(self):
        app = super(TestExportUrlController, self).create_app()
        app.config.update({
            'TABLE_NAMES': ['project_id.dataset_id.table_name']
        })
        return app

    def test_export_url_post(self):
        response = self.client.post('/exportUrl')
        self.assert200(response)
        expected_json = {
            "name": 'table_name',
            "entityType": "BigQuery table",
            "attributes": {
                "table_name": 'project_id.dataset_id.table_name'
            }
        }
        self.assertEquals(expected_json, json.loads(response.json['url']))


if __name__ == '__main__':
    import unittest
    unittest.main()
