import connexion
import six

from data_explorer.models.dataset_response import DatasetResponse  # noqa: E501
from data_explorer import util
from ..dataset_faceted_search import get_dataset_name
from ..dataset_faceted_search import get_table_names


def dataset_get():  # noqa: E501
    """dataset_get

    Gets dataset information, such as name. # noqa: E501

    :rtype: DatasetResponse
    """
    return DatasetResponse(name=get_dataset_name(), table_names=get_table_names())
