# Data explorer

## Quickstart

Run Data explorer with a test dataset:

* `docker-compose up`
* Navigate to `localhost:4400`

To use a different dataset:

* Index your data into the Elasticsearch started by `docker-compose up`. You can
use one of the indexers at
https://github.com/DataBiosphere/data-explorer-indexers, or any other indexer.
* In `api`, create a symlink named `config` that points to a config directory similar to
[this one](https://github.com/DataBiosphere/data-explorer-indexers/tree/8f22de4ad7750c60ab4d73d6608cb154436f68af/bigquery/config/template).
Specifically:

  * There must be a file named `dataset.json` that has a `name` field. This
determines the name of the Elasticsearch index.

## Architecture overview

For local development, nginx is used to get around CORS.

![Architecture overview](https://i.imgur.com/VU8dZlZ.png)

## Development

### Updating the API using swagger-codegen
We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to
automatically implement the API, as defined in `api/api.yaml`, for the API
server and the UI. Whenever the API is updated, follow these steps to
update the server implementations:

TODO(melissachang): Add Javascript definitions for React.

* Clear out existing generated models:
    ```
    sudo rm api/data_explorer/models/*
    ```
* Regenerate both the python and Javascript definitions.
    ```
    java -jar ~/swagger-codegen-cli.jar generate \
      -i api/api.yaml \
      -l python-flask \
      -o api \
      -DsupportPython2=true,packageName=data_explorer
    ```
* Update the server implementations to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

### One-time setup

* Install `swagger-codegen-cli.jar`.
```
# Linux
wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O ~/swagger-codegen-cli.jar
# macOS
brew install swagger-codegen
```
* [Set up git secrets.](https://github.com/DataBiosphere/data-explorer/tree/master/hooks)
