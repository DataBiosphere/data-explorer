from flask import json

from data_explorer.test.base_test_case import BaseTestCase

dataset_name = 'Test data'
table_names = [
    "test_project1.test_dataset1.test_table1",
    "test_project1.test_dataset1.test_table2",
    "test_project2.test_dataset2.test_table3",
    "test_project2.test_dataset3.test_table4"
]


class TestDatasetController(BaseTestCase):
    """DatasetController integration test stubs"""

    def create_app(self):
        app = super(TestDatasetController, self).create_app()
        app.config.update({
            'DATASET_NAME': dataset_name,
            'TABLE_NAMES': table_names
        })
        return app

    def test_dataset_get(self):
        """Test case for dataset_get"""
        response = self.client.get('/dataset')
        self.assert200(response)
        self.assertEquals(
            dict(name=dataset_name, tableNames=table_names), response.json)


if __name__ == '__main__':
    import unittest
    unittest.main()
