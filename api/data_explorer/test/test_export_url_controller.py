from flask import json
from elasticsearch_dsl import TermsFacet
from data_explorer.test.base_test_case import BaseTestCase

dataset_name = 'Test data'


class TestExportUrlController(BaseTestCase):
    """ExportUrlController integration test stubs"""

    def create_app(self):
        app = super(TestExportUrlController, self).create_app()
        app.config.update({
            'DATASET_NAME': dataset_name,
            'TABLE_NAMES': ['project_id.dataset_id.table_name']
        })
        return app

    def test_export_url_post(self):
        """Test case for dataset_get"""
        response = self.client.post('/exportUrl')
        self.assert200(response)
        expected_json = {
            "name": 'Test data',
            "entityType": "BigQueryTables",
            "attributes": {
                "Dataset": 'dataset_id',
                "TableID": 'project_id.dataset_id.table_name'
            }
        }
        self.assertEquals([expected_json], response.json['url'])


if __name__ == '__main__':
    import unittest
    unittest.main()
