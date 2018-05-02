# coding: utf-8

import connexion
import logging

from flask import Flask
from flask import json
from flask_testing import TestCase
from six import BytesIO

from data_explorer.encoder import JSONEncoder
from data_explorer.models.dataset_response import DatasetResponse  # noqa: E501
from data_explorer.test import BaseTestCase


class TestDatasetController(TestCase):
    """DatasetController integration test stubs"""

    def create_app(self):
        logging.getLogger('connexion.operation').setLevel('ERROR')
        app = connexion.App(__name__, specification_dir='../swagger/')
        app.app.json_encoder = JSONEncoder
        app.add_api('swagger.yaml')
        app.app.config.update({
            'DATASET_CONFIG_DIR': '../config',
        })
        return app.app

    def test_dataset_get(self):
        """Test case for dataset_get"""
        response = self.client.get('/dataset')
        self.assert200(response)
        self.assertEquals(dict(name='Test data'), response.json)


if __name__ == '__main__':
    import unittest
    unittest.main()
