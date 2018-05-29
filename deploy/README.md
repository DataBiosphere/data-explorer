# Deploy on App Engine Flex

### Setup

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