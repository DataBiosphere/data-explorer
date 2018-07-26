import connexion
import six

from flask import current_app

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501


def export_url_post():  # noqa: E501
    return ExportUrlResponse(url='EXPORT_URL')
