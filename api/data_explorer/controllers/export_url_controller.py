import base64
import connexion
import datetime
import six
import json
import os
import random
import string
import sys
import time
import urllib.parse

from collections import OrderedDict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl import HistogramFacet
from flask import request
from flask import current_app
from werkzeug.exceptions import BadRequest
from google.cloud import storage
from google.auth.transport import requests
from google.auth import compute_engine

from data_explorer.models.export_url_response import ExportUrlResponse  # noqa: E501
from data_explorer.util import elasticsearch_util
from data_explorer.util import query_util
from data_explorer.util.dataset_faceted_search import DatasetFacetedSearch

# Save in Terra flow
# - User clicks export button on bottom right of Data Explorer
# - A dialog pops up, asking user to name cohort. User types "African females"
#   and clicks Export button
# - UI server calls API server /export_url (this file):
#   - Constructs a JSON array of JSON entity objects
#   - Writes JSON array to a GCS file
#   - Concat that with an existing samples JSON entity file, which contains
#     all the samples in the dataset and is created on indexing.
#   - Creates a signed url for GCS file. Returns signed url to UI server
# - UI server redirects to Terra add-import?url=SIGNED_URL
# - On add-import page, user selects Workspace. User clicks Import button.
# - User is redirected to selected workspace Data tab, showing newly imported
#   entities.


def _check_preconditions():
    config_path = os.path.join(current_app.config['DATASET_CONFIG_DIR'],
                               'deploy.json')
    if not os.path.isfile(config_path):
        error_msg = (
            'deploy.json not found. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['DEPLOY_PROJECT_ID']:
        error_msg = (
            'Project not set in deploy.json. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)

    if not current_app.config['EXPORT_URL_GCS_BUCKET']:
        error_msg = (
            'Project not set in deploy.json or export URL GCS bucket not '
            'found. Save in Terra feature will not work. '
            'See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature'
        )
        current_app.logger.error(error_msg)
        raise BadRequest(error_msg)


def _get_entities_dict(cohort_name, filter_arr, data_explorer_url, sql_query):
    """Returns a dict representing the JSON list of entities."""
    # Terra add-import expects a JSON list of entities, where each entity is
    # the entity JSON passed into
    # https://rawls.dsde-prod.broadinstitute.org/#!/entities/create_entity
    entities = []
    for table_name in current_app.config['TABLES']:
        entities.append({
            # FireCloud doesn't allow spaces, so use underscore.
            'entityType': 'BigQuery_table',
            # This is the entity ID. Ideally this would be
            # project_id.dataset_id.table_name, and we wouldn't need the
            # table_name attribute. Unfortunately RAWLS doesn't allow
            # periods here. RAWLS does allow periods in attributes. So use
            # underscores here and periods in table_name attribute.
            'name': table_name.replace('.', '_').replace(':', '_'),
            'attributes': {
                'dataset_name': current_app.config['DATASET_NAME'],
                'table_name': table_name,
            }
        })

    entities.append({
        'entityType': 'cohort',
        'name': cohort_name,
        'attributes': {
            'dataset_name': current_app.config['DATASET_NAME'],
            'query': sql_query,
            'data_explorer_url': data_explorer_url,
        }
    })

    return entities


def _write_gcs_file(entities):
    """Returns GCS file path of the format /bucket/object."""
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    export_bucket = client.get_bucket(
        current_app.config['EXPORT_URL_GCS_BUCKET'])
    user = os.environ.get('USER')
    random_str = ''.join(
        random.choice(string.ascii_letters + string.digits) for _ in range(10))
    blob = export_bucket.blob(random_str)
    entities_json = json.dumps(entities)
    blob.upload_from_string(entities_json)

    current_app.logger.info(
        'Wrote gs://%s/%s' %
        (current_app.config['EXPORT_URL_GCS_BUCKET'], blob.name))
    # Return in the format that signing a URL needs.
    return '/%s/%s' % (current_app.config['EXPORT_URL_GCS_BUCKET'], blob.name)

def _create_signed_url(gcs_path):
    auth_request = requests.Request()
    service_account_email = current_app.config[
        'DEPLOY_PROJECT_ID'] + '@appspot.gserviceaccount.com'
    client = storage.Client(project=current_app.config['DEPLOY_PROJECT_ID'])
    export_bucket = client.get_bucket(
        current_app.config['EXPORT_URL_GCS_BUCKET'])
    blob = export_bucket.blob(gcs_path)
    signing_credentials = compute_engine.IDTokenCredentials(
        auth_request,
        "",
        service_account_email=service_account_email)
    signed_url = blob.generate_signed_url(
        version='v4',
        # Signed URL will be valid for 5 minutes
        expiration=datetime.timedelta(minutes=5),
        credentials=signing_credentials,
        method='GET')
    signed_url = urllib.parse.quote(signed_url, safe='')
    current_app.logger.info('Signed URL: ' + signed_url)
    return signed_url


def export_url_post():  # noqa: E501
    _check_preconditions()
    data = json.loads(request.data)
    current_app.logger.info('Export URL request data %s' % request.data)

    entities = _get_entities_dict(data['cohortName'], data['filter'],
                                  data['dataExplorerUrl'], data['sqlQuery'])
    gcs_path = _write_gcs_file(entities)
    signed_url = _create_signed_url(gcs_path)
    return ExportUrlResponse(
        url=signed_url,
        authorization_domain=current_app.config['AUTHORIZATION_DOMAIN'])
