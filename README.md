# Data explorer

## Architecture overview

For local development, nginx is used to get around CORS.

![Architecture overview](https://i.imgur.com/tKv8FEL.png)

## Development

### Updating the API using swagger-codegen
We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to
automatically implement the API, as defined in `api/api.yaml`, for the API
server and the UI. Whenever the API is updated, follow these steps to
update the server implementations:

TODO(melissachang): Add Javascript definitions for React.

1. If you do not already have the jar, you can download it here:
    ```
    # Linux
    wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O ~/swagger-codegen-cli.jar
    # macOS
    brew install swagger-codegen
    ```
1. Clear out existing generated models:
    ```
    rm api/data_explorer/models/*
    ```
1. Regenerate both the python and Javascript definitions.
    ```
    java -jar ~/swagger-codegen-cli.jar generate \
      -i api/api.yaml \
      -l python-flask \
      -o api \
      -DsupportPython2=true,packageName=data_explorer
    ```
1. Update the server implementations to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

### One-time setup
[Set up git secrets.](https://github.com/DataBiosphere/data-explorer/tree/master/hooks)
