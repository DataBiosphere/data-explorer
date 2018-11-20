#!/bin/bash
#
# Creates GCS bucket for the Send to Terra feature.
#
# See export_url_controller.py for more information.
#
# jq, gsutil must be installed before running this script.

set -o errexit
set -o nounset

if (( $# != 1 ))
then
  echo "Usage: deploy/create-export-url-bucket.sh <dataset>"
  echo "  where <dataset> is the name of a directory in dataset_config/"
  echo "Run this script from project root"
  exit 1
fi

dataset=$1
project_id=$(jq --raw-output '.project_id' dataset_config/${dataset}/deploy.json)
bucket=gs://${project_id}-export

if gsutil ls ${bucket} > /dev/null; then
  echo "${bucket} already exists"
  exit 0
fi

echo "Creating ${bucket}"
gsutil mb -p ${project_id} ${bucket}

echo "Setting bucket TTL to 1 day"
gsutil lifecycle set deploy/export-url-bucket-lifecycle.json ${bucket}

echo "Setting up CORS"
gsutil cors set deploy/export-url-bucket-cors.json ${bucket}
