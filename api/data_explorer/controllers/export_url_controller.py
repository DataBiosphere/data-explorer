import connexion
import json
import os
import six

from flask import current_app
from werkzeug.exceptions import BadRequest

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501


def export_url_post():  # noqa: E501
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        raise BadRequest(
            'deploy.json not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        raise BadRequest(
            'Export URL GCS bucket not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )

    requests = []
    for table_name in current_app.config['TABLE_NAMES']:
        # Treat table names as BigQuery tables if they conform to project_id.dataset.table_id
        if len(table_name.split(".")) == 3:
            requests.append(
                json.dumps({
                    "name": table_name.split(".")[2],
                    "entityType": "BigQuery table",
                    "attributes": {
                        "table_name": table_name
                    }
                }))
    # TODO: Create a signed URL using the output of this request
    return ExportUrlResponse(url="".join(requests))
