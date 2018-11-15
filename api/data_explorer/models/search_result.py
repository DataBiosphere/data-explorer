# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from data_explorer.models.base_model_ import Model
from data_explorer import util


class SearchResult(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """

    def __init__(self,
                 facet_name=None,
                 facet_description=None,
                 elasticsearch_field_name=None,
                 facet_value=None):  # noqa: E501
        """SearchResult - a model defined in Swagger

        :param facet_name: The facet_name of this SearchResult.  # noqa: E501
        :type facet_name: str
        :param facet_description: The facet_description of this SearchResult.  # noqa: E501
        :type facet_description: str
        :param elasticsearch_field_name: The elasticsearch_field_name of this SearchResult.  # noqa: E501
        :type elasticsearch_field_name: str
        :param facet_value: The facet_value of this SearchResult.  # noqa: E501
        :type facet_value: str
        """
        self.swagger_types = {
            'facet_name': str,
            'facet_description': str,
            'elasticsearch_field_name': str,
            'facet_value': str
        }

        self.attribute_map = {
            'facet_name': 'facet_name',
            'facet_description': 'facet_description',
            'elasticsearch_field_name': 'elasticsearch_field_name',
            'facet_value': 'facet_value'
        }

        self._facet_name = facet_name
        self._facet_description = facet_description
        self._elasticsearch_field_name = elasticsearch_field_name
        self._facet_value = facet_value

    @classmethod
    def from_dict(cls, dikt):
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The SearchResult of this SearchResult.  # noqa: E501
        :rtype: SearchResult
        """
        return util.deserialize_model(dikt, cls)

    @property
    def facet_name(self):
        """Gets the facet_name of this SearchResult.

        The name of the facet.  # noqa: E501

        :return: The facet_name of this SearchResult.
        :rtype: str
        """
        return self._facet_name

    @facet_name.setter
    def facet_name(self, facet_name):
        """Sets the facet_name of this SearchResult.

        The name of the facet.  # noqa: E501

        :param facet_name: The facet_name of this SearchResult.
        :type facet_name: str
        """

        self._facet_name = facet_name

    @property
    def facet_description(self):
        """Gets the facet_description of this SearchResult.

        The description of the facet.  # noqa: E501

        :return: The facet_description of this SearchResult.
        :rtype: str
        """
        return self._facet_description

    @facet_description.setter
    def facet_description(self, facet_description):
        """Sets the facet_description of this SearchResult.

        The description of the facet.  # noqa: E501

        :param facet_description: The facet_description of this SearchResult.
        :type facet_description: str
        """

        self._facet_description = facet_description

    @property
    def elasticsearch_field_name(self):
        """Gets the elasticsearch_field_name of this SearchResult.

        The Elasticsearch field name.  # noqa: E501

        :return: The elasticsearch_field_name of this SearchResult.
        :rtype: str
        """
        return self._elasticsearch_field_name

    @elasticsearch_field_name.setter
    def elasticsearch_field_name(self, elasticsearch_field_name):
        """Sets the elasticsearch_field_name of this SearchResult.

        The Elasticsearch field name.  # noqa: E501

        :param elasticsearch_field_name: The elasticsearch_field_name of this SearchResult.
        :type elasticsearch_field_name: str
        """

        self._elasticsearch_field_name = elasticsearch_field_name

    @property
    def facet_value(self):
        """Gets the facet_value of this SearchResult.

        If this search result represents a field, facet_value is the empty string. If this search result represents a field and selected value, facet_value is the selected value.  # noqa: E501

        :return: The facet_value of this SearchResult.
        :rtype: str
        """
        return self._facet_value

    @facet_value.setter
    def facet_value(self, facet_value):
        """Sets the facet_value of this SearchResult.

        If this search result represents a field, facet_value is the empty string. If this search result represents a field and selected value, facet_value is the selected value.  # noqa: E501

        :param facet_value: The facet_value of this SearchResult.
        :type facet_value: str
        """

        self._facet_value = facet_value
