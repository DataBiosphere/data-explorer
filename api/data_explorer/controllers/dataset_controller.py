import connexion
import six

from flask import current_app

from data_explorer.models.dataset_response import DatasetResponse  # noqa: E501


def dataset_get():  # noqa: E501
    """dataset_get

    Gets dataset information, such as name. # noqa: E501

    :rtype: DatasetResponse
    """

    dataset_response = DatasetResponse(name=current_app.config['DATASET_NAME'])

    if current_app.config.get('SEARCH_PLACEHOLDER_TEXT'):
        dataset_response.search_placeholder_text = current_app.config[
            'SEARCH_PLACEHOLDER_TEXT']

    return dataset_response
