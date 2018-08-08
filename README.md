# Data explorer

[![CircleCI](https://circleci.com/gh/DataBiosphere/data-explorer.svg?style=svg)](https://circleci.com/gh/DataBiosphere/data-explorer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Overview

Data Explorer lets you explore a dataset. The code (in this repo and
[data-explorer-indexers repo](https://github.com/DataBiosphere/data-explorer-indexers))
is dataset-agnostic. All dataset configuration happens in config files.

For example, [here's the Data Explorer](https://test-data-explorer.appspot.com/)
for the public [1000 Genomes](http://www.internationalgenome.org/about) dataset.
The config files for this dataset are [here](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/1000_genomes)
and [here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/dataset_config/1000_genomes).

## Quickstart

Run local Data Explorer with a test dataset:

* `docker-compose up --build`
* Navigate to `localhost:4400`
* If you want to use Export to Saturn feature, [do this one-time setup](https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature).

## Run local Data Explorer with a custom dataset

* Index your dataset into Elasticsearch.  
   Before you can run the servers in this repo to display a Data Explorer UI,
  your dataset must be indexed into Elasticsearch.
  You can use one of the indexers at
  https://github.com/DataBiosphere/data-explorer-indexers, or any other indexer.
* Create `dataset_config/<my dataset>`

  * If you used https://github.com/DataBiosphere/data-explorer-indexers, copy
    the config directory from there.
  * Copy and fill out [ui.json](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/template/ui.json).
    (`ui.json` is not in `data-explorer-indexers` repo.)
  * If you used your own indexer, copy the config files from [here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/dataset_config/template)
    and [here](https://github.com/DataBiosphere/data-explorer/tree/master/dataset_config/template).
    All files except `gcs.json` must be filled out.

* If you want to use Export to Saturn feature, [do this one-time setup](https://github.com/DataBiosphere/data-explorer#one-time-setup-for-export-to-saturn-feature).
* `DATASET_CONFIG_DIR=/app/dataset_config/<my dataset> docker-compose up --build`
* Navigate to `localhost:4400`

## Architecture overview

For local development, an nginx reverse proxy is used to get around CORS.

![Architecture overview](https://i.imgur.com/IZLbPx9.png)

## Development

### Updating the API using swagger-codegen

We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to
automatically implement the API, as defined in `api/api.yaml`, for the API
server and the UI. Whenever the API is updated, follow these steps to
update the server implementations:

* Clear out existing generated models:
  ```
  rm ui/src/api/src/model/*
  rm api/data_explorer/models/*
  ```
* Regenerate Javascript and Python definitions.
  * From the .jar (Linux):
    ```
    java -jar ~/swagger-codegen-cli.jar generate -i api/api.yaml -l python-flask -o api -DsupportPython2=true,packageName=data_explorer
    java -jar ~/swagger-codegen-cli.jar generate -i api/api.yaml -l javascript -o ui/src/api -DuseES6=true
    yapf -ir . --exclude ui/node_modules
    ```
  * From the global script (macOS or other):
    ```
    swagger-codegen generate -i api/api.yaml -l python-flask -o api -DsupportPython2=true,packageName=data_explorer
    swagger-codegen generate -i api/api.yaml -l javascript -o ui/src/api -DuseES6=true
    yapf -ir . --exclude ui/node_modules
    ```
* Update the server implementations to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

### One-time setup

* `docker-compose` should be at least [1.21.0](https://github.com/docker/compose/releases/tag/1.21.0).
The data-explorer-indexer repo
[refers to the network](https://github.com/DataBiosphere/data-explorer-indexers/blob/master/bigquery/docker-compose.yml#L34)
created by `docker-compose` in this repo. Prior to 1.21.0, the network name was
`dataexplorer_default`. Starting with 1.21.0, the network name is
`data-explorer_default`.
* Install `swagger-codegen-cli.jar`. This is only needed if you modify
[api.yaml](https://github.com/DataBiosphere/data-explorer/blob/master/api/api.yaml)

  ```
  # Linux
  wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.3.1/swagger-codegen-cli-2.3.1.jar -O ~/swagger-codegen-cli.jar
  # macOS
  brew install swagger-codegen
  ```
* In `ui/` run `npm install`. This will install tools used during git precommit,
  such as formatting tools.
* [Set up git secrets.](https://github.com/DataBiosphere/data-explorer/tree/master/hooks)

#### One-time setup for Export to Saturn feature

The Export to Saturn feature temporarily stores data in a GCS bucket.

* If `~/.config/gcloud/application_default_credentials.json` doesn't exist,
create it by running `gcloud auth application-default login`.
* If you haven't already, fill out [deploy.json](https://github.com/DataBiosphere/data-explorer-indexers/blob/master/dataset_config/template/deploy.json)
for your dataset.
  * Even if you don't plan on deploying Data Explorer to GCP,
`deploy.json` will still need to be filled out. A temporary file will be written to a
GCS bucket in the project in `deploy.json`, even for local deployment of Data
Explorer. Choose a project where you have at least Project Editor permissions.
* TODO(melissachang): Add instructions for creating bucket in the project
specified in `deploy.json`.

### Testing

Every commit on a remote branch kicks off all tests [on CircleCI](https://circleci.com/gh/DataBiosphere).

UI unit tests use [Jest](https://facebook.github.io/jest/) and [Enzyme](https://github.com/airbnb/enzyme). To run locally: `cd ui && npm install && npm test`

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
These tests use the [test dataset in test/](https://github.com/DataBiosphere/data-explorer/tree/master/test).
To run locally:

```
docker-compose up --build
cd ui && npm run test:e2e
```

### Formatting

`ui/` is formatted with [Prettier](https://prettier.io/). husky is used to automatically format files upon commit.

Python files are formatted with [YAPF](https://github.com/google/yapf).
