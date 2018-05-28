# Deploy on App Engine Flex

### Setup

* Create the App Engine application:

`gcloud app create`

### Deploy the UI Server

* Modify `ui/package.json` with the appropriate API URL

* Deploy:
`cd ../ui && gcloud app deploy && cd ../deploy`

* Navigating to the UI URL should display an empty page for now, as the API
server has not yet been set up.

### Deploy the API Server

* Ensure that `api/config` contains the correct dataset and facet fields for 
your project and index

* Provide the `ELASTICSEARCH_URL` in `app.yaml`

* Deploy:

`cd ../api && gcloud app deploy && cd ../deploy`

Note: App Engine services are not always available immediately after deploying.
Allow a few minutes after deployment finishes for the service to come up.

* Making requests to the API server (e.g. /api/facets or /api/datasets) should 
return JSON responses if you have set up the elasticsearch server properly. 
Navigating to the UI URL should return the full UI page.
