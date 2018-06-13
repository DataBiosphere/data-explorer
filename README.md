# Data explorer

[![CircleCI](https://circleci.com/gh/DataBiosphere/data-explorer.svg?style=svg)](https://circleci.com/gh/DataBiosphere/data-explorer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Quickstart

Run local Data explorer with a test dataset:

* `docker-compose up --build`
* Navigate to `localhost:4400`

## Run local Data explorer with a specific dataset

This repo contains an API server that reads from Elasticsearch, and a UI server
that calls the API server. When running the UI and API servers, it is assumed
that the dataset has already been indexed into Elasticsearch.

To index your dataset into Elasticsearch, you can use one of the indexers at
https://github.com/DataBiosphere/data-explorer-indexers, or any other indexer.

* Index your data into Elasticsearch.
* Create `api/dataset_config/<my dataset>`
    * If you used https://github.com/DataBiosphere/data-explorer-indexers, copy
    the config directory from there.
    * If you used your own indexer, the config files must follow
    this format ([see examples](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/dataset_config/platinum_genomes)):
      * `dataset.json` has a `name` field. This determines the name of the Elasticsearch index.
      * `facet_fields.csv` has the `readable_field_name` column filled out.

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
    ```
  * From the global script (macOS or other):
    ```
    swagger-codegen generate -i api/api.yaml -l python-flask -o api -DsupportPython2=true,packageName=data_explorer
    swagger-codegen generate -i api/api.yaml -l javascript -o ui/src/api -DuseES6=true
    ```
* Update the server implementations to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

### One-time setup

* Change `vm.max_map_count`. This is needed for running Elasticsearch locally.
  Add `vm.max_map_count=262144` to `/etc/sysctl.conf`. Then run `sysctl -p`.
* Install `swagger-codegen-cli.jar`.

```
# Linux
wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.3.1/swagger-codegen-cli-2.3.1.jar -O ~/swagger-codegen-cli.jar
# macOS
brew install swagger-codegen
```

* In `ui/` run `npm install`. This will install tools used during git precommit,
  such as formatting tools.
* [Set up git secrets.](https://github.com/DataBiosphere/data-explorer/tree/master/hooks)

### Testing

Every commit on a remote branch kicks off all tests [on CircleCI](https://circleci.com/gh/DataBiosphere).

UI unit tests use [Jest](https://facebook.github.io/jest/) and [Enzyme](https://github.com/airbnb/enzyme). To run locally: `cd ui && npm test`

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
