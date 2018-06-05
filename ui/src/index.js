import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

console.log('API_URL is ' + window.env.API_URL);
ReactDOM.render(<App />, document.getElementById("root"));
registerServiceWorker();

