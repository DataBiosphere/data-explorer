# Data explorer

[![CircleCI](https://circleci.com/gh/DataBiosphere/data-explorer.svg?style=svg)](https://circleci.com/gh/DataBiosphere/data-explorer)

## Overview

Data Explorer lets you explore a dataset. The code (in this repo and
[data-explorer-indexers repo](https://github.com/DataBiosphere/data-explorer-indexers))
is dataset-agnostic. All dataset configuration happens in config files.

Examples:

- [Data Explorer](https://test-data-explorer.appspot.com/)
  for the [1000 Genomes](http://www.internationalgenome.org/about) dataset.
  Config files [here](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/1000_genomes)
  and [here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/dataset_config/1000_genomes).
- [Data Explorer](https://time-series-data-explorer.appspot.com/)
  for the [Framingham Heart Study Teaching Dataset](http://www.internationalgenome.org/about). This Data Explorer demonstrates time-series visualizations.
  Config files [here](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/framingham_heart_study_teaching)
  and [here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/dataset_config/framingham_heart_study_teaching).

## Quickstart

Run local Data Explorer with the 1000 Genomes dataset:

- If `~/.config/gcloud/application_default_credentials.json` doesn't exist,
  create it by running `gcloud auth application-default login`.
- `docker-compose up --build`
- Navigate to `localhost:4400`
- If you want to use the Save in Terra feature, [do this one-time setup](https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature).

## Run local Data Explorer with a custom dataset

- Index your dataset into Elasticsearch.  
   Before you can run the servers in this repo to display a Data Explorer UI,
  your dataset must be indexed into Elasticsearch. Use an indexer from
  https://github.com/DataBiosphere/data-explorer-indexers.
- Create `dataset_config/<my dataset>`

  - If you used https://github.com/DataBiosphere/data-explorer-indexers, copy
    the config directory from there.
  - Copy and fill out [ui.json](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/template/ui.json).
    (`ui.json` is not in `data-explorer-indexers` repo.)
  - If you used your own indexer, copy the config files from [here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/dataset_config/template)
    and [here](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/template).
    All files except `gcs.json` must be filled out.

- If you want to use the Save in Terra feature, [do this one-time setup](https://github.com/DataBiosphere/data-explorer#one-time-setup-for-save-in-terra-feature).
- If `~/.config/gcloud/application_default_credentials.json` doesn't exist,
  create it by running `gcloud auth application-default login`.
- `DATASET_CONFIG_DIR=dataset_config/<my dataset> docker-compose up --build -t 0`

  - The `-t 0` makes Kibana stop more quickly after `Ctrl-C`
  - If ES crashes due to OOM, you can increase [heap size](https://www.elastic.co/guide/en/elasticsearch/reference/current/heap-size.html):
    ```
    ES_JAVA_OPTS="-Xms10g -Xmx10g" docker-compose up --build -t 0
    ```

- Navigate to `localhost:4400`

## Architecture overview

The basic flow:

1.  Index dataset into Elasticsearch using an indexer from https://github.com/DataBiosphere/data-explorer-indexers
2.  Run the servers in this repo to display Data Explorer UI

GCP deployment:

![GCP deployment architecture](https://i.imgur.com/bClb3Na.png)

For local development, an nginx reverse proxy is used to get around CORS:

![Local deployment architecture](https://i.imgur.com/IZLbPx9.png)

## Want to try out Data Explorer for your dataset?

Here's one possible flow.

- [Run local Data Explorer with public 1000 Genomes dataset.](https://github.com/DataBiosphere/data-explorer#quickstart)  
  This makes sure docker and git are installed correctly. (A JSON cache of the
  1000 Genomes indices is imported into Elasticsearch; no indexer is run.)
- [Run local BigQuery indexer with 1000 Genomes dataset](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery#quickstart)
- Run locally with your dataset
  - [Run BigQuery indexer on your dataset](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery#index-a-custom-dataset-locally)
  - [Run UI and API servers for your dataset](https://github.com/DataBiosphere/data-explorer#run-local-data-explorer-with-a-custom-dataset)
- Deploy on GCP for your dataset
  - [Deploy indexer for your dataset](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
  - [Deploy UI and API servers for your dataset](https://github.com/DataBiosphere/data-explorer/tree/master/deploy)

### Sample file support

If your dataset includes sample files (VCF, BAM, etc), then Data Explorer will have:

- A Samples Overview facet, which gives an overview of your sample files:

  <img src="https://i.imgur.com/JuLczW5.png" width="400">

- Sample file facets will display number of sample files instead of number of
  participants. For example, if your dataset has 100 participant and each participant
  has 5 files, and there is a facet for "Raw coverage", the number on the upper
  right of the facet can be 0-500, and represents how many sample files are in the
  current selection.

### Time series support

If your dataset has longitudinal data, then Data Explorer will show
time-series visualizations:

<img src="https://i.imgur.com/tPM63dX.png" width="400">

## Development

### Updating the API using swagger-codegen

We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to
automatically implement the API, as defined in `api/api.yaml`, for the API
server and the UI. Whenever the API is updated, follow these steps to
update the server implementations:

- Clear out existing generated models:
  ```
  rm ui/src/api/src/model/*
  rm api/data_explorer/models/*
  ```
- Regenerate Javascript and Python definitions.
  - From the .jar (Linux):
    ```
    java -jar ~/swagger-codegen-cli.jar generate -i api/api.yaml -l python-flask -o api -DsupportPython2=true,packageName=data_explorer
    java -jar ~/swagger-codegen-cli.jar generate -i api/api.yaml -l javascript -o ui/src/api -DuseES6=true
    yapf -ir . --exclude ui/node_modules --exclude api/.tox
    ```
  - From the global script (macOS or other):
    ```
    swagger-codegen generate -i api/api.yaml -l python-flask -o api -DsupportPython2=true,packageName=data_explorer
    swagger-codegen generate -i api/api.yaml -l javascript -o ui/src/api -DuseES6=true
    yapf -ir . --exclude ui/node_modules
    ```
- Update API and UI servers.
- Don't forget to fix JS warnings. (Otherwise CircleCI will fail.)

### One-time setup

- `docker-compose` should be at least [1.21.0](https://github.com/docker/compose/releases/tag/1.21.0).
  The data-explorer-indexer repo
  [refers to the network](https://github.com/DataBiosphere/data-explorer-indexers/blob/master/bigquery/docker-compose.yml#L34)
  created by `docker-compose` in this repo. Prior to 1.21.0, the network name was
  `dataexplorer_default`. Starting with 1.21.0, the network name is
  `data-explorer_default`.
- Install `swagger-codegen-cli.jar`. This is only needed if you modify
  [api.yaml](https://github.com/DataBiosphere/data-explorer/blob/master/api/api.yaml)

  ```
  # Linux
  wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.3.1/swagger-codegen-cli-2.3.1.jar -O ~/swagger-codegen-cli.jar
  # macOS
  brew install swagger-codegen
  ```

- In `ui/` run `npm install`. This will install tools used during git precommit,
  such as formatting tools.
- [Set up git secrets.](https://github.com/DataBiosphere/data-explorer/tree/master/hooks)

#### One-time setup for Save in Terra feature

The Save in Terra feature temporarily stores data in a GCS bucket.

- If you haven't already, fill out [deploy.json](https://github.com/DataBiosphere/data-explorer-indexers/blob/master/dataset_config/template/deploy.json)
  for your dataset.
  - Even if you don't plan on deploying Data Explorer to GCP,
    `deploy.json` will still need to be filled out. A temporary file will be written to a
    GCS bucket in the project in `deploy.json`, even for local deployment of Data
    Explorer. Choose a project where you have at least Project Editor permissions.
- Create export bucket. This only needs to be done once per deploy project.
  Run `deploy/create-export-url-bucket.sh DATASET` from the root of the repo,
  where `DATASET` is the name of the directory in `dataset_config`.
- The Save in Terra feature requires a service account private key. Follow
  these instructions to download a key. This needs to be done once per person
  per deploy project. If three people run Data Explorer with the same deploy
  project, then all three need to download a key for the deploy project.
  - Go to the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts)
    for your deploy project.
  - Click on the three-dot Actions menu for the
    `App Engine default service account` -> Create Key -> CREATE.
  - Move the downloaded file to `dataset_config/DATASET/private-key.json`

### Testing

Every commit on a remote branch kicks off all tests [on CircleCI](https://circleci.com/gh/DataBiosphere).

API server unit tests use [pytest](https://docs.pytest.org/en/latest/) and
[tox](https://tox.readthedocs.io/en/latest/). To run locally:

```
virtualenv ~/virtualenv/tox
source ~/virtualenv/tox/bin/activate
pip install tox
cd api && tox
```

End-to-end tests use [Puppeteer](https://github.com/GoogleChrome/puppeteer) and
[jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).
To run locally:

```
# Optional: ensure the elasticsearch index is clean
docker-compose up --build -d elasticsearch
curl -XDELETE localhost:9200/_all
# Start the rest of the services
docker-compose up --build
cd ui && npm test
```

Troubleshooting tips for end-to-end tests:

- [Uncomment headless](https://github.com/DataBiosphere/data-explorer/blob/master/ui/jest-puppeteer.config.js)
  to see the browser during test run.
- Run a single test: `npm test -- -t Participant`
- [More tips here](https://github.com/GoogleChrome/puppeteer#debugging-tips)

### Formatting

`ui/` is formatted with [Prettier](https://prettier.io/). husky is used to automatically format files upon commit. To fix formatting, in `ui/` run `npm run fix`.

Python files are formatted with [YAPF](https://github.com/google/yapf).
