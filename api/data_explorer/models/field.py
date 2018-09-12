# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from data_explorer.models.base_model_ import Model
from data_explorer import util


class Field(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """

    def __init__(self, name=None, description=None,
                 elasticsearch_name=None):  # noqa: E501
        """Field - a model defined in Swagger

        :param name: The name of this Field.  # noqa: E501
        :type name: str
        :param description: The description of this Field.  # noqa: E501
        :type description: str
        :param elasticsearch_name: The elasticsearch_name of this Field.  # noqa: E501
        :type elasticsearch_name: str
        """
        self.swagger_types = {
            'name': str,
            'description': str,
            'elasticsearch_name': str
        }

        self.attribute_map = {
            'name': 'name',
            'description': 'description',
            'elasticsearch_name': 'elasticsearch_name'
        }

        self._name = name
        self._description = description
        self._elasticsearch_name = elasticsearch_name

    @classmethod
    def from_dict(cls, dikt):
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The Field of this Field.  # noqa: E501
        :rtype: Field
        """
        return util.deserialize_model(dikt, cls)

    @property
    def name(self):
        """Gets the name of this Field.

        Field name, for example, \"Gender\".  # noqa: E501

        :return: The name of this Field.
        :rtype: str
        """
        return self._name

    @name.setter
    def name(self, name):
        """Sets the name of this Field.

        Field name, for example, \"Gender\".  # noqa: E501

        :param name: The name of this Field.
        :type name: str
        """

        self._name = name

    @property
    def description(self):
        """Gets the description of this Field.

        Optional field description.  # noqa: E501

        :return: The description of this Field.
        :rtype: str
        """
        return self._description

    @description.setter
    def description(self, description):
        """Sets the description of this Field.

        Optional field description.  # noqa: E501

        :param description: The description of this Field.
        :type description: str
        """

        self._description = description

    @property
    def elasticsearch_name(self):
        """Gets the elasticsearch_name of this Field.

        The elasticsearch field name.  # noqa: E501

        :return: The elasticsearch_name of this Field.
        :rtype: str
        """
        return self._elasticsearch_name

    @elasticsearch_name.setter
    def elasticsearch_name(self, elasticsearch_name):
        """Sets the elasticsearch_name of this Field.

        The elasticsearch field name.  # noqa: E501

        :param elasticsearch_name: The elasticsearch_name of this Field.
        :type elasticsearch_name: str
        """

        self._elasticsearch_name = elasticsearch_name