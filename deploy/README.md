# Deploy on App Engine Flex

### Whitelist your project

In order to ensure that your indexed data stays safe and secure, we use 
Identity-Aware Proxy (IAP) to authenticate all requests made against the UI 
and API servers. However, IAP does not currently support OPTIONS headers, 
including CORS which our servers use to communicate. In order to bypass this 
restriction, your project must be whitelisted to allow unauthenticated 
pre-flight CORS requests. Contact alanhwang@verily.com or somebody on the Data 
Explorer team to obtain whitelist access before attempting to deploy your 
instance.

### Setup

* Create the App Engine application:

`gcloud app create`

### Deploy the UI Server

* Modify `ui/package.json` with the appropriate API URL

* Deploy:
`cd ../ui && gcloud app deploy && cd ../deploy`

### Deploy the API Server

* Ensure that `api/config` contains the correct dataset and facet fields for 
your project and index

* Provide the `ELASTICSEARCH_URL` in `app.yaml`

* Deploy:

`cd ../api && gcloud app deploy && cd ../deploy`

Note: App Engine services are not always available immediately after deploying.
Allow a few minutes after deploy completes for the service to come up.

### Enable IAP
* [Set up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#iap-access) 
including both the UI (default) and API (api-dot) URLs to be restricted.