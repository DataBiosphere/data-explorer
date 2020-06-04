#!/bin/bash
DATASET="1000_genomes"
PROJECT_ID="ukb-itt-data-explorer-test"
CLUSTER_NAME="es-cluster"

gcloud auth activate-service-account ukb-itt-data-explorer-test@appspot.gserviceaccount.com --key-file="dataset_config/${DATASET}/private-key.json" 
gcloud config set project "${PROJET_ID}"
gcloud container clusters get-credentials "${CLUSTER_NAME}" --zone us-central1-c

gunicorn data_explorer.__main__:app