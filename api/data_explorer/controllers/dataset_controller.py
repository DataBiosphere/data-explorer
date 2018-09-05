import connexion
import six

from flask import current_app

from data_explorer.models.dataset_response import DatasetResponse  # noqa: E501


def dataset_get():  # noqa: E501
    """dataset_get

    Gets dataset information, such as name. # noqa: E501

    :rtype: DatasetResponse
    """
    enable_field_search = False
    if 'ENABLE_FIELD_SEARCH' in current_app.config and current_app.config['ENABLE_FIELD_SEARCH']:
        enable_field_search = True
    return DatasetResponse(
        name=current_app.config['DATASET_NAME'],
        enable_field_search=enable_field_search)
