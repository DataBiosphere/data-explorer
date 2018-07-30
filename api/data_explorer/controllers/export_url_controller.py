import connexion
import six
import json

from flask import current_app

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501


def export_url_post():  # noqa: E501
    requests = []
    for table_name in current_app.config['TABLE_NAMES']:
        # Treat table names as BigQuery tables if they conform to project_id.dataset.table_id
        if len(table_name.split(".")) == 3:
            requests.append(
                json.dumps({
                    "name": table_name.split(".")[2],
                    "entityType": "BigQuery tables",
                    "attributes": {
                        "table_name": table_name
                    }
                }))
    # TODO: Create a signed URL using the output of this request
    return ExportUrlResponse(url="".join(requests))
