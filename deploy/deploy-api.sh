#!/bin/bash
#
# Deploy API Server on GCP.
#
# This script assumes Elasticsearch was deployed following the instructions in
# https://github.com/DataBiosphere/data-explorer-indexers/. Specifically, there
# must be a GKE cluster named "elasticsearch-cluster".
#
# jq, gcloud, and kubectl must be installed before running this script.

set -o errexit
set -o nounset

if (( $# != 1 ))
then
  echo "Usage: deploy/deploy-api.sh <dataset>"
  echo "  where <dataset> is the name of a directory in dataset_config/"
  echo "Run this script from project root"
  exit 1
fi

dataset=$1
project_id=$(jq --raw-output '.project_id' dataset_config/${dataset}/deploy.json)

if [ ! -f "dataset_config/${dataset}/private-key.json" ]; then
	echo "Private key not found. Send to Terra feature will not work. "
	echo "See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-send-to-terra-feature."
	exit 1
fi

if ! gsutil ls "gs://${project_id}-export" &> /dev/null; then
	echo "Export bucket not found. Send to Terra feature will not work. "
	echo "See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-send-to-terra-feature."
	exit 1
fi

echo "Deploying ${dataset} API Server to project ${project_id}"
echo

# Initialize gcloud and kubectl commands
gcloud config set project ${project_id}
gke_cluster_zone=$(gcloud container clusters list | grep elasticsearch-cluster | awk '{print $2}')
gcloud container clusters get-credentials elasticsearch-cluster --zone ${gke_cluster_zone}

# Create api/app.yml from api/app.yml.templ
elasticsearch_url=$(kubectl get svc elasticsearch | grep elasticsearch | awk '{print $4}')
sed -e "s/MY_DATASET/${dataset}/" api/app.yaml.templ > api/app.yaml
sed -i -e "s/MY_ELASTICSEARCH_URL/${elasticsearch_url}/" api/app.yaml

# Temporarily copy api/Dockerfile, api/app.yaml to project root.
# Unlike docker-compose, App Engine Flexible requires that docker build context
# be in same directory as Dockerfile. Build context must be project root in
# order to pickup dataset_config/.
cp api/Dockerfile api/app.yaml .

# Deploy App Engine api service
gcloud app deploy --quiet
rm Dockerfile app.yaml

# Set up routing rules
cd deploy && gcloud app deploy --quiet dispatch.yaml
