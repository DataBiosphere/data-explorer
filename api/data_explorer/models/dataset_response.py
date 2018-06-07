# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from data_explorer.models.base_model_ import Model
from data_explorer import util


class DatasetResponse(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """

    def __init__(self, name=None, table_references=None):  # noqa: E501
        """DatasetResponse - a model defined in Swagger

        :param name: The name of this DatasetResponse.  # noqa: E501
        :type name: str
        :param table_references: The table_references of this DatasetResponse.  # noqa: E501
        :type table_references: List[str]
        """
        self.swagger_types = {'name': str, 'table_references': List[str]}

        self.attribute_map = {
            'name': 'name',
            'table_references': 'tableReferences'
        }

        self._name = name
        self._table_references = table_references

    @classmethod
    def from_dict(cls, dikt):
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The DatasetResponse of this DatasetResponse.  # noqa: E501
        :rtype: DatasetResponse
        """
        return util.deserialize_model(dikt, cls)

    @property
    def name(self):
        """Gets the name of this DatasetResponse.


        :return: The name of this DatasetResponse.
        :rtype: str
        """
        return self._name

    @name.setter
    def name(self, name):
        """Sets the name of this DatasetResponse.


        :param name: The name of this DatasetResponse.
        :type name: str
        """

        self._name = name

    @property
    def table_references(self):
        """Gets the table_references of this DatasetResponse.


        :return: The table_references of this DatasetResponse.
        :rtype: List[str]
        """
        return self._table_references

    @table_references.setter
    def table_references(self, table_references):
        """Sets the table_references of this DatasetResponse.


        :param table_references: The table_references of this DatasetResponse.
        :type table_references: List[str]
        """

        self._table_references = table_references
