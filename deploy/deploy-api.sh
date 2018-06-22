#!/bin/bash
#
# Deploy API Server on GCP.
#
# This script assumes Elasticsearch was deployed following the instructions in
# https://github.com/DataBiosphere/data-explorer-indexers/. Specifically, there
# must be a GKE cluster named "elasticsearch-cluster".
#
# jq, gcloud, and kubectl must be installed before running this script.

if (( $# != 1 ))
then
  echo "Usage: deploy/deploy-api.sh <dataset>"
  echo "  where <dataset> is the name of a directory in api/dataset_config/"
  echo "Run this script from project root"
  exit 1
fi

dataset=$1
project_id=$(jq --raw-output '.project_id' api/dataset_config/${dataset}/deploy.json)

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

# Deploy App Engine api service
cd api && gcloud app deploy --quiet

# Set up routing rules
cd ../deploy && gcloud app deploy --quiet dispatch.yaml
