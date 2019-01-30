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

    if 'ENABLE_SEARCH_VALUES' in current_app.config and current_app.config[
            'ENABLE_SEARCH_VALUES']:
        dataset_response.enable_search_values = True

    if 'SHOW_VIZ_TOGGLE' in current_app.config and current_app.config[
            'SHOW_VIZ_TOGGLE']:
        dataset_response.show_viz_toggle = True

    if 'SEARCH_PLACEHOLDER_TEXT' in current_app.config and current_app.config[
            'SEARCH_PLACEHOLDER_TEXT']:
        dataset_response.search_placeholder_text = current_app.config[
            'SEARCH_PLACEHOLDER_TEXT']

    return dataset_response
