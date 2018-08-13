import connexion
import six
import json
import os
import random
import string
import sys

from flask import current_app
from werkzeug.exceptions import BadRequest
from google.cloud import storage

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


def _check_preconditions():
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        error_msg = (
            'deploy.json not found. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['DEPLOY_PROJECT_ID']:
        error_msg = (
            'Project not set in deploy.json. Export to Saturn feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature-for-export-to-saturn-feature'
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


def _get_entities_dict():
    """Returns a dict representing the JSON list of entities."""
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
    return entities


def _write_gcs_file(entities):
    """Returns GCS file path."""
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    bucket = client.get_bucket(current_app.config['EXPORT_URL_GCS_BUCKET'])
    # Random 10 character string
    random_str = ''.join(
        random.choice(string.ascii_letters + string.digits) for _ in range(10))
    blob = bucket.blob(random_str)
    blob.upload_from_string(json.dumps(entities))
    current_app.logger.info(
        'Wrote gs://%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'],
                              random_str))


def export_url_post():  # noqa: E501
    _check_preconditions()
    entities = _get_entities_dict()
    current_app.logger.info('Entity JSON: %s' % json.dumps(entities))

    # Don't actually write GCS file during unit test. If we wrote a file during
    # unit test, in order to make it easy for anyone to run this test, we would
    # have to create a world-readable bucket.
    if 'pytest' in sys.modules:
        return 'foo'

    _write_gcs_file(entities)

    # TODO: Create a signed URL using the output of this request
    return ExportUrlResponse(url='format=entitiesJson&url=Coming soon')
