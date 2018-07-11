# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from data_explorer.models.base_model_ import Model
from data_explorer.models.facet_value import FacetValue  # noqa: F401,E501
from data_explorer import util


class Facet(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """

    def __init__(self, name=None, description=None, values=None):  # noqa: E501
        """Facet - a model defined in Swagger

        :param name: The name of this Facet.  # noqa: E501
        :type name: str
        :param description: The description of this Facet.  # noqa: E501
        :type description: str
        :param values: The values of this Facet.  # noqa: E501
        :type values: List[FacetValue]
        """
        self.swagger_types = {
            'name': str,
            'description': str,
            'values': List[FacetValue]
        }

        self.attribute_map = {
            'name': 'name',
            'description': 'description',
            'values': 'values'
        }

        self._name = name
        self._description = description
        self._values = values

    @classmethod
    def from_dict(cls, dikt):
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The Facet of this Facet.  # noqa: E501
        :rtype: Facet
        """
        return util.deserialize_model(dikt, cls)

    @property
    def name(self):
        """Gets the name of this Facet.

        Facet name, for example, \"Gender\".  # noqa: E501

        :return: The name of this Facet.
        :rtype: str
        """
        return self._name

    @name.setter
    def name(self, name):
        """Sets the name of this Facet.

        Facet name, for example, \"Gender\".  # noqa: E501

        :param name: The name of this Facet.
        :type name: str
        """

        self._name = name

    @property
    def description(self):
        """Gets the description of this Facet.

        Optional facet description.  # noqa: E501

        :return: The description of this Facet.
        :rtype: str
        """
        return self._description

    @description.setter
    def description(self, description):
        """Sets the description of this Facet.

        Optional facet description.  # noqa: E501

        :param description: The description of this Facet.
        :type description: str
        """

        self._description = description

    @property
    def values(self):
        """Gets the values of this Facet.


        :return: The values of this Facet.
        :rtype: List[FacetValue]
        """
        return self._values

    @values.setter
    def values(self, values):
        """Sets the values of this Facet.


        :param values: The values of this Facet.
        :type values: List[FacetValue]
        """

        self._values = values
