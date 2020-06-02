#!/bin/bash
#
# Deploy API Server on GCP.
#
# This script assumes Elasticsearch was deployed following the instructions in
# https://github.com/DataBiosphere/data-explorer-indexers/. Specifically, there
# must be a GKE cluster named "elasticsearch-cluster*".
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

util/setup-gcloud.sh ${dataset}
project_id=$(kubectl config current-context | cut -d "_" -f 2)

if [ ! -f "dataset_config/${dataset}/private-key.json" ]; then
	echo "Private key not found. Save in Terra feature will not work. "
	echo "See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature."
	exit 1
fi

if ! gsutil ls "gs://${project_id}-export" &> /dev/null; then
	echo "Export bucket not found. Save in Terra feature will not work. "
	echo "See https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature."
	exit 1
fi

bold=$(tput bold)
normal=$(tput sgr0)
echo "Deploying API server for ${bold}dataset ${dataset}${normal} to ${bold}project ${project_id}${normal}"
echo

# Create api/MY_DATASET.app.yaml from api/app.yaml.templ
# MY_DATASET is so this script can be run with mulitple datasets simultaneously,
# and they won't clobber each other's app.yaml
elasticsearch_url=$(kubectl get svc quickstart-es-http | grep quickstart | awk '{print $4}')
git_commit=$(git rev-parse HEAD)
sed -e "s/MY_DATASET/${dataset}/" api/app.yaml.templ > api/${dataset}.app.yaml
sed -i -e "s/MY_ELASTICSEARCH_URL/${elasticsearch_url}/" api/${dataset}.app.yaml
sed -i -e "s/MY_GIT_COMMIT/${git_commit}/" api/${dataset}.app.yaml

# Temporarily copy api/Dockerfile, api/app.yaml to project root.
# Unlike docker-compose, App Engine Flexible requires that docker build context
# be in same directory as Dockerfile. Build context must be project root in
# order to pickup dataset_config/.
cp api/Dockerfile api/${dataset}.app.yaml .

# Deploy App Engine api service
gcloud app deploy --quiet ${dataset}.app.yaml
# -f option because Dockerfile may already be removed a different instance of deploy-api.sh
rm -f Dockerfile api/${dataset}.app.yaml ${dataset}.app.yaml

# Reset gcloud project in case a different deploy-api.sh was started while this one was running.
gcloud config set project ${project_id}
# Set up routing rules
cd deploy && gcloud app deploy --quiet dispatch.yaml
