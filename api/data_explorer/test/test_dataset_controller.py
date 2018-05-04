from flask import json

from data_explorer.test.base_test_case import BaseTestCase


class TestDatasetController(BaseTestCase):
    """DatasetController integration test stubs"""

    def create_app(self):
        app = super(TestDatasetController, self).create_app()
        app.config.update({
            'DATASET_CONFIG_DIR': '../config',
        })
        return app

    def test_dataset_get(self):
        """Test case for dataset_get"""
        response = self.client.get('/dataset')
        self.assert200(response)
        self.assertEquals(dict(name='Test data'), response.json)


if __name__ == '__main__':
    import unittest
    unittest.main()
