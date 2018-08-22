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
  identify a Google Group of users who who can access this deployment.
  - If your users will send data to Saturn, this group must be a FireCloud
    group. The reason is, FireCloud Authorization Domains will be used to
    ensure that only approved people can see data in Saturn. For example:
    - For a given dataset, only people in FireCloud group G/Google Group
      G@firecloud.org, are allowed to see this dataset.
    - In `dataset.json`, `authorization_domain` is set to G.
    - User U is in FireCloud group G/Google group G@firecloud.org.
    - User U can see Data Explorer, which is acled to G@firecloud.org.
    - User U clicks on Send to Saturn button. Because `authorization_domain` was
      set in `dataset.json`, only workspaces with Authorization Domain G are
      listed. If `authorization_domain` wasn't set in `dataset.json`, U could
      send data to a workspace whose users aren't authorized to see the dataset.
    So the same group will be used for Authorization Domain (FireCloud group)
    and IAP (Google Group corresponding to FireCloud group).

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
