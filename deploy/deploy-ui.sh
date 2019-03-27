#!/bin/bash
#
# Deploy UI Server on GCP.
#
# gcloud must be installed before running this script.

set -o errexit
set -o nounset

if (( $# != 1 ))
then
  echo "Usage: deploy/deploy-ui.sh <dataset>"
  echo "  where <dataset> is the name of a directory in dataset_config/"
  echo "Run this script from project root"
  exit 1
fi

dataset=$1
project_id=$(jq --raw-output '.project_id' dataset_config/${dataset}/deploy.json)

bold=$(tput bold)
normal=$(tput sgr0)
echo "Deploying UI server for ${bold}dataset ${dataset}${normal} to ${bold}project ${project_id}${normal}"
echo

# Initialize gcloud command
gcloud config set project ${project_id}

# Create ui/app.yml from ui/app.yml.templ
git_commit=$(git rev-parse HEAD)
sed -e "s/MY_GIT_COMMIT/${git_commit}/" ui/app.yaml.templ > ui/app.yaml

# Deploy App Engine api service
cd ui
gcloud app deploy --quiet
