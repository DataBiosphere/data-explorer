# coding: utf-8

from __future__ import absolute_import

from flask import json
from six import BytesIO

from data_explorer.models.dataset_response import DatasetResponse  # noqa: E501
from data_explorer.test import BaseTestCase


class TestDatasetController(BaseTestCase):
    """DatasetController integration test stubs"""

    def test_dataset_get(self):
        """Test case for dataset_get

        
        """
        response = self.client.open(
            '/dataset',
            method='GET')
        self.assert200(response,
                       'Response body is : ' + response.data.decode('utf-8'))


if __name__ == '__main__':
    import unittest
    unittest.main()
