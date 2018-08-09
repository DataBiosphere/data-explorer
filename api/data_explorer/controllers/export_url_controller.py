import connexion
import six
import json

from flask import current_app
from werkzeug.exceptions import BadRequest

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501

# Export to Saturn flow
# - User clicks export button on bottom right of Data Explorer
# - A dialog pops up, asking user to name cohort. User types "African females"
#   and clicks Export button
# - UI server calls API server /export_url (this file):
#   - Constructs a JSON array of JSON entity objects
#   - Writes JSON array to a GCS file
#   - Creates a signed url for GCS file. Returns signed url to UI server
# - UI server redirects to Saturn add-import?url=SIGNED_URL
# - On add-import page, user selects Workspace. User clicks Import button.
# - User is redirected to selected workspace Data tab, showing newly imported
#   entities.


def export_url_post():  # noqa: E501
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        error_msg = (
            'deploy.json not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        error_msg = (
            'Project not set in deploy.json or export URL GCS bucket not '
            'found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    # Saturn add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name in current_app.config['TABLE_NAMES']:
        splits = table_name.split('.')
        if len(splits) != 3:
            raise BadRequest(
                'Unknown format for table name %s. Expected BigQuery project_id.dataset_id.table_name'
            )
        entities.append({
            # FireCloud doesn't allow spaces, so use underscore.
            'entityType': 'BigQuery_table',
            # This is the entity ID. Ideally this would be
            # project_id.dataset_id.table_name, and we wouldn't need the
            # table_name attribute. Unfortunately RAWLS doesn't allow
            # periods here. RAWLS does allow periods in attributes. So use
            # underscores here and periods in table_name attribute.
            'name': table_name.replace('.', '_'),
            'attributes': {
                'table_name': table_name
            }
        })
    current_app.logger.info('Export URL file: %s' % json.dumps(entities))

    # TODO: Create a signed URL using the output of this request
    return ExportUrlResponse(url='format=entitiesJson&url=Coming soon')
