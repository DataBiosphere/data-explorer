import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { ApiClient, FacetsApi } from 'data_explorer_service';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }

  componentDidMount() {
    var apiClient = new ApiClient();
    apiClient.basePath = '/api'
    var api = new FacetsApi(apiClient)
    var callback = function(error, data, response) {
      if (error) {
        console.error(error);
      } else {
        console.log('API called successfully. Returned data: ');
        console.log(data);
      }
    };
    api.facetsGet(callback);
  }
}
export default App;
