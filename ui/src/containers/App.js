import './App.css';
import { ApiClient, FacetsApi } from 'data_explorer_service';
import Facet from "../api/src/model/Facet";
import FacetValue from "../api/src/model/FacetValue";
import FacetsResponse from "../api/src/model/FacetsResponse";
import FacetsGrid from "../components/FacetsGrid";
import Header from "../components/Header";

import React, { Component } from 'react';
import { MuiThemeProvider } from "material-ui";

class App extends Component {

  constructor(props) {
    super(props);
      this.state = {
          facetResponse: null
      };
  }

  render() {
    if (this.state.facetResponse == null) {
      // Server has not yet responded or returned an error
      return <div></div>;
    } else {
        return (
            <MuiThemeProvider>
                <div className="app">
                    <Header count = {this.state.facetResponse.count} />
                    <FacetsGrid facetResponse = {this.state.facetResponse} />
                </div>
            </MuiThemeProvider>
        );
    }
  }

  componentDidMount() {
    let apiClient = new ApiClient();
    apiClient.basePath = '/api';
    let api = new FacetsApi(apiClient);
    let callback = function(error, data) {
      if (error) {
        console.error(error);
        // TODO(alanhwang): Redirect to an error page
      } else {
        this.setState({facetResponse: data});
      }
    }.bind(this);
    api.facetsGet(callback);
  }
}

export default App;
