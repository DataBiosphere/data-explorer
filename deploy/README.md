# Deploy on Google Cloud Platform

### Setup

- [Follow these instructions](https://github.com/DataBiosphere/data-explorer-indexers/tree/master/bigquery/deploy)
  to bring up Elasticsearch in GKE and index dataset.

- Create `dataset_config/MY_DATASET` if it doesn't already exist. If you used
  https://github.com/DataBiosphere/data-explorer-indexers, you can copy the
  config directory from there.

  - Make sure `dataset_config/MY_DATASET/deploy.json` is filled out.

- If you haven't done so already, set the default project:

  `gcloud config set project PROJECT_ID`

- If you haven't done so already, create the App Engine application:

  `gcloud app create`

  Choose the same region that your Elasticsearch cluster is in.

### Deploy the UI Server

- Deploy:

  `cd ui && gcloud app deploy`

### Enable Access Control

- If this Data Explorer deployment is private, work with the Dataset owner to
  identify a Google Group of users who who can access this deployment. This could
  be a pre-existing Google Group of users who have read-only access to the
  underlying data, or it could be a broader group.

- Follow the [instructions for setting up IAP](https://cloud.google.com/iap/docs/app-engine-quickstart#enabling_iap)
  to restrict access to the aforementioned Google Group. Turn on IAP for one
  domain name: `https://PROJECT_ID.appspot.com`

- Confirm IAP is working.
  - Navigate to `https://PROJECT_ID.appspot.com`. Login as a user who is in the
    Google Group. You will see a blank page, since the API server is not running
    yet.
  - In an incognito window, navigate to `https://PROJECT_ID.appspot.com`. Login
    as a user who is not in the Google Group. You should see a "You don't have
    access" page.

### Deploy the API Server

- From project root run `deploy/deploy-api.sh MY_DATASET`, where `MY_DATASET` is
  the name of the config directory in `dataset_config`.
- Navigate to `https://PROJECT_ID.appspot.com`. Note: App Engine deployment is
  slow and can take up 10 minutes. When `deploy/deploy-api.sh` returns, that means
  deployment has completed.
