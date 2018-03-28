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
          facets: null,
          totalCount: null
      };

      this.apiClient = new ApiClient();
      this.apiClient.basePath = '/api';
      this.facetsApi = new FacetsApi(this.apiClient);
      this.facetsCallback = function(error, data) {
          if (error) {
              console.error(error);
              // TODO(alanhwang): Redirect to an error page
          } else {
              this.setState({
                  facets: data.facets,
                  totalCount: data.count
              });
          }
      }.bind(this);
      this.searchFilters = new Map();
      this.updateFacets = this.updateFacets.bind(this);
  }

  render() {
    if (this.state.facets == null || this.state.datasetName === '') {
      // Server has not yet responded or returned an error
      return <div></div>;
    } else {
        return (
            <MuiThemeProvider>
                <div className="app">
                    <Header
                        datasetName={this.state.datasetName}
                        totalCount={this.state.totalCount}
                    />
                    <FacetsGrid
                        updateFacets={this.updateFacets}
                        facets={this.state.facets}
                        totalCount={this.state.totalCount}
                    />
                </div>
            </MuiThemeProvider>
        );
    }
  }

  componentDidMount() {
    this.facetsApi.facetsGet({}, this.facetsCallback);

    // Call /api/dataset
    let datasetApi = new DatasetApi(this.apiClient);
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

    /**
     * Updates the selection for a single facet value and refreshes the facets data from the server.
     * @param facetName string containing the name of the facet corresponding to this value
     * @param facetValue string containing the name of this facet value
     * @param isSelected bool indicating whether this facetValue should be added to or removed from the query
     * */
    updateFacets(facetName, facetValue, isSelected) {
        let currentFacetValues = this.searchFilters.get(facetName);
        if (isSelected) {
            // Add facetValue to the list of filters for facetName
            if (currentFacetValues === undefined) {
                this.searchFilters.set(facetName, [facetValue]);
            } else {
                currentFacetValues.push(facetValue);
            }
        } else if (this.searchFilters.get(facetName) !== undefined) {
            // Remove facetValue from the list of filters for facetName
            this.searchFilters.set(facetName, this.removeFacet(currentFacetValues, facetValue));
        }
        this.facetsApi.facetsGet({filter: this.serializeFilters(this.searchFilters)}, this.facetsCallback);
    }

    removeFacet(valueList, facetValue) {
        let newValueList = [];
        for (let i = 0; i < valueList.length; i++) {
            if (valueList[i] !== facetValue) {
                newValueList.push(valueList[i])
            }
        }
        return newValueList;
    }

    serializeFilters(searchFilters) {
        let filterArr = [];
        searchFilters.forEach((values, key) => {
            if (values.length > 0) {
                for (let value of values) {
                    filterArr.push(key + "=" + value);
                }
            }
        });
        return filterArr;
    }
}

export default App;
