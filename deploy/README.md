# Deploy on Google Cloud Platform

If your dataset is private, there must be a Google Group of users who have
access to the data. [Identity-Aware Proxy](https://cloud.google.com/iap/docs/)
will be used to restrict Data Explorer to users in this Google Group.

### Setup

* [Follow these instructions](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
to bring up Elasticsearch in GKE and index dataset.

* If you haven't done so already, set the default project:

  `gcloud config set project PROJECT_ID`

* If you haven't done so already, create the App Engine application:

  `gcloud app create`
  
### Enable Access Control

* Follow the [instructions for setting up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#enabling_iap)
to restrict access to your app (and potentially sensitive elasticsearch data)
to an approved set of users. The URL you'll publish should be
`https://PROJECT_ID.appspot.com`

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

### Deploy the UI Server

* Deploy:

  `cd ui && gcloud app deploy`

* Navigating to the UI URL should display an empty page for now, as the API
server has not yet been set up. This is a good time to confirm that your IAP
permissions are working as intended to ensure you do not expose any sensitive
data once the API service is deployed.

### Deploy the API Server

* Ensure that `api/dataset_config/` contains your config

* Provide the `ELASTICSEARCH_URL` in `api/app.yaml`

* Deploy:

  `cd api && gcloud app deploy`

* Set up routing rules:

  `cd deploy && gcloud app deploy dispatch.yaml`

Note: App Engine services are not always available immediately after deploying.
Allow a few minutes after deployment finishes for the service to come up.