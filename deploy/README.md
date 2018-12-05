# Deploy on Google Cloud Platform

### Setup

* [Follow these instructions](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
  to bring up Elasticsearch in GKE and index dataset.

* Create `dataset_config/MY_DATASET` if it doesn't already exist. If you used
  https://github.com/DataBiosphere/data-explorer-indexers, you can copy the
  config directory from there.

  * Make sure `dataset_config/MY_DATASET/deploy.json` is filled out.

* Set gcloud project: `gcloud config set project PROJECT_ID`

* Create the App Engine application: `gcloud app create`  
  Choose the same region that your Elasticsearch cluster is in.

### Deploy the UI Server

* Deploy:
  ```
  gcloud config set project PROJECT_ID
  cd ui && gcloud app deploy
  ```

### Enable Access Control

For private datasets, restrict who can see Data Explorer.

* Follow the [instructions for setting up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#enabling_iap)
  to restrict access to the readers Google Group. Turn on IAP for
  `App Engine app`, not for `default` service.

* Confirm IAP is working.
  * Navigate to `https://PROJECT_ID.appspot.com`. Login as a user who is in the
    Google Group. You will see a blank page, since the API server is not running
    yet.
  * In an incognito window, navigate to `https://PROJECT_ID.appspot.com`. Login
    as a user who is not in the Google Group. You should see a "You don't have
    access" page.

### Deploy the API Server

* From project root run `deploy/deploy-api.sh MY_DATASET`, where `MY_DATASET` is
  the name of the config directory in `dataset_config`.
* Navigate to `https://PROJECT_ID.appspot.com`. Note: App Engine deployment is
  slow and can take up 10 minutes. When `deploy/deploy-api.sh` returns, that means
  deployment has completed.
