import './App.css';
import { ApiClient, DatasetApi, FacetsApi } from 'data_explorer_service';
import DatasetResponse from "./api/src/model/DatasetResponse";
import FacetsGrid from "./components/FacetsGrid";
import Header from "./components/Header";

import React, { Component } from 'react';
import { MuiThemeProvider } from "material-ui";

class App extends Component {

  constructor(props) {
      super(props);
      this.state = {
          datasetName: '',
          facetsResponse: null
      };
  }

  render() {
    if (this.state.facetsResponse == null || this.state.datasetName == '') {
      // Server has not yet responded or returned an error
      return <div></div>;
    } else {
        return (
            <MuiThemeProvider>
                <div className="app">
                    <Header
                        datasetName={this.state.datasetName}
                        totalCount={this.state.facetsResponse.count}
                    />
                    <FacetsGrid facetsResponse={this.state.facetsResponse} />
                </div>
            </MuiThemeProvider>
        );
    }
  }

  componentDidMount() {
    // Call /api/facets
    let apiClient = new ApiClient();
    apiClient.basePath = '/api';
    let facetsApi = new FacetsApi(apiClient);
    let facetsCallback = function(error, data) {
      if (error) {
        console.error(error);
        // TODO(alanhwang): Redirect to an error page
      } else {
        this.setState({facetsResponse: data});
      }
    }.bind(this);
    facetsApi.facetsGet({}, facetsCallback);


    // Call /api/dataset
    let datasetApi = new DatasetApi(apiClient);
    let datasetCallback = function(error, data) {
      if (error) {
        console.error(error);
        // TODO(alanhwang): Redirect to an error page
      } else {
        this.setState({datasetName: data.name});
      }
    }.bind(this);
    datasetApi.datasetGet(datasetCallback);
  }
}

export default App;
