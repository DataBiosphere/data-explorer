import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(<App />, document.getElementById("root"));

// Turn off service worker caching because it doesn't work with Identity-Aware
// Proxy.
// - The first time xxx-data-explorer.appspot.com loads, user goes through OAuth
//   flow. CORS does not apply because this is a full page load, as opposed to
//   an XHR. GCP_IAAP_AUTH_TOKEN is set and is valid for one hour (see
//   https://cloud.google.com/iap/docs/sessions-howto).
// - After an hour, say I load xxx-data-explorer.appspot.com again.
//   xxx-data-explorer.appspot.com is loaded from cache due to Create React App
//   service working caching. See https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#making-a-progressive-web-app
// - Client-side Javascript makes /dataset XHR. When IAP receives this XHR, it
//   detects that the cookie has expired and redirects to accounts.google.com
//   for OAuth flow. CORS applies since this is an XHR.
//   xxx-data-explorer.appspot.com does not have permission to make requests to
//   accounts.google.com.
// Disable service worker caching as described at
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#opting-out-of-caching
// registerServiceWorker();
