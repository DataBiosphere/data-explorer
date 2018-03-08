# coding: utf-8

from __future__ import absolute_import

from . import BaseTestCase
from six import BytesIO
from flask import json


class TestFacetsController(BaseTestCase):
    """ FacetsController integration test stubs """

    def test_facets_get(self):
        """
        Test case for facets_get

        
        """
        response = self.client.open('/facets',
                                    method='GET')
        self.assert200(response, "Response body is : " + response.data.decode('utf-8'))


if __name__ == '__main__':
    import unittest
    unittest.main()
