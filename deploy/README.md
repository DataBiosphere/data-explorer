# Deploy on Google Cloud Platform

### Setup


* [Follow these instructions](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
to bring up Elasticsearch in GKE and index dataset. If you are indexing
sensitive data, set up Elasticsearch only, deploy the app and ensure IAP is
properly enabled here before indexing your Elasticsearch instance.

* If you haven't done so already, set the default project:

  `gcloud config set project PROJECT_ID`

* Create the App Engine application:

  `gcloud app create`

* Set up routing rules

  `gcloud app deploy dispatch.yaml`

### Deploy the UI Server

* Deploy:

  `cd ../ui && gcloud app deploy && cd ../deploy`

* Navigating to the UI URL should display an empty page for now, as the API
server has not yet been set up.

### Deploy the API Server

* Ensure that `api/config` contains the correct dataset and facet fields for
your project and index

* Provide the `ELASTICSEARCH_URL` in `api/app.yaml`

* Deploy:

  `cd ../api && gcloud app deploy && cd ../deploy`

Note: App Engine services are not always available immediately after deploying.
Allow a few minutes after deployment finishes for the service to come up.

### Enable Access Control

* Follow the [instructions for setting up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#enabling_iap)
to restrict access to your app (and potentially sensitive elasticsearch data)
to an approved set of users.

Note: [Identity-Aware Proxy](https://cloud.google.com/iap/docs/) is used to
restrict access to the App Engine deployments to a Google Group. UI server and
API server are deployed as two App Engine services. Normally, CORS is used to
allow UI server client Javascript to call API server domain:port.
Identity-Aware Proxy doesn't work well with CORS. CORS can be enabled for UI
server -> API server, but IAP introduces UI server -> accounts.google.com,
which CORS cannot be enabled for. We use [App Engine routing](https://cloud.google.com/appengine/docs/standard/python/how-requests-are-routed#routing_with_a_dispatch_file)
to get around CORS. UI server calls /api on itself, so CORS does not come into
play. (This is similar to our [nginx proxying](https://github.com/DataBiosphere/data-explorer/blob/master/nginx.conf)
for local development.)