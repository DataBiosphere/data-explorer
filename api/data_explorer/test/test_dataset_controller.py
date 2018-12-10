from flask import json

from data_explorer.test.base_test_case import BaseTestCase

dataset_name = 'Test data'


class TestDatasetController(BaseTestCase):
    """DatasetController integration test stubs"""

    def create_app(self):
        app = super(TestDatasetController, self).create_app()
        app.config.update({'DATASET_NAME': dataset_name})
        return app

    def test_dataset_get(self):
        """Test case for dataset_get"""
        expected_response = {
            'name': dataset_name,
            'enable_visualizations': False
        }
        actual_response = self.client.get('/dataset')
        self.assert200(actual_response)
        self.assertEquals(expected_response, actual_response.json)


if __name__ == '__main__':
    import unittest
    unittest.main()
