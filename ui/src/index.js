import React from "react";
import ReactDOM from "react-dom";

import "index.css";
import App from "App";

ReactDOM.render(<App />, document.getElementById("root"));

// Turn off service worker caching because it doesn't work with Identity-Aware
// Proxy. See https://github.com/DataBiosphere/data-explorer/pull/88
// import registerServiceWorker from "registerServiceWorker";
// registerServiceWorker();
