# Deploy on Google Cloud Platform

If your dataset is private, there must be a Google Group of users who have
access to the dataset. [Identity-Aware Proxy](https://cloud.google.com/iap/docs/)
will be used to restrict Data Explorer to users in this Google Group.

### Setup

* [Follow these instructions](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
to bring up Elasticsearch in GKE and index dataset.

* If you haven't done so already, set the default project:

  `gcloud config set project PROJECT_ID`

* If you haven't done so already, create the App Engine application:

  `gcloud app create`

### Deploy the UI Server

* Deploy:

  `cd ui && gcloud app deploy`

### Enable Access Control

* Follow the [instructions for setting up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#enabling_iap)
to restrict access to your app (and potentially sensitive Elasticsearch data)
to an approved Google Group. Turn on IAP for one domain name:
`https://PROJECT_ID.appspot.com`

* Confirm IAP is working.
  * Navigate to `https://PROJECT_ID.appspot.com`. Login as a user who is in the
  Google Group. You will see a blank page, since API server is not running yet.
  * In an incognito window, navigate to `https://PROJECT_ID.appspot.com`. Login
  as a user who is not in the Google Group. You should see a "You don't have
  access" page.

### Deploy the API Server

* Ensure that `api/dataset_config/` contains your config. If you are using the
default platinum_genomes dataset, you can get config files [from here](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/config/platinum_genomes).

* Find the `ELASTICSEARCH_URL`. Run `kubectl get svc`, look for `elasticsearch`
row, `EXTERNAL-IP` column. Note that because the Elasticsearch deployment uses
an [Internal Load Balancer](https://cloud.google.com/kubernetes-engine/docs/how-to/internal-load-balancing)
, this IP is only accessible from the internal GCP network for this project.

* Set the `ELASTICSEARCH_URL` in `api/app.yaml`

* Deploy:

  `cd api && gcloud app deploy`

* Set up routing rules:

  `cd deploy && gcloud app deploy dispatch.yaml`

  Note: UI server and API server are deployed as two App Engine services. Normally,
CORS is used to allow UI server client Javascript to call API server domain:port.
Identity-Aware Proxy doesn't work well with CORS. CORS can be enabled for UI
server -> API server, but IAP introduces UI server -> accounts.google.com,
which CORS cannot be enabled for. We use [App Engine routing](https://cloud.google.com/appengine/docs/standard/python/how-requests-are-routed#routing_with_a_dispatch_file)
to get around CORS. UI server calls /api on itself, so CORS does not come into
play. (This is similar to our [nginx proxying](https://github.com/DataBiosphere/data-explorer/blob/master/nginx.conf)
for local development.)

* Navigate to `https://PROJECT_ID.appspot.com`. Note: App Engine services are
not always available immediately after deploying. Allow a few minutes after
deployment finishes for the service to come up.