#!/bin/bash
#
# Configure gcloud and kubectl for a dataset.

set -o errexit
set -o nounset

if (( $# != 1 ))
then
  echo "Usage: util/setup-gcloud.sh <dataset>"
  echo "  where <dataset> is the name of a directory in dataset_config/"
  echo "Run this script from project root"
  exit 1
fi

dataset=$1
project_id=$(jq --raw-output '.project_id' dataset_config/${dataset}/deploy.json)

gcloud config set project ${project_id}
echo "gcloud project set to $(gcloud config get-value project)"

# Need to get cluster name by sorting the list of clusters, and choosing to
# use the one with the greatest timestamp (most recent)
cluster_line=$(gcloud container clusters list | grep elasticsearch-cluster- | sort -rn -k1 | head -n1)
cluster_name=$(echo $cluster_line | awk '{print $1}')
zone=$(echo $cluster_line | awk '{print $2}')
gcloud container clusters get-credentials ${cluster_name} --zone ${zone}
