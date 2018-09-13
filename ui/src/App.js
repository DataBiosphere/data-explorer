import "./App.css";
import {
  ApiClient,
  DatasetApi,
  FacetsApi,
  FieldsApi
} from "data_explorer_service";
import ExportFab from "./components/ExportFab";
import FacetsGrid from "./components/facets/FacetsGrid";
import FieldSearch from "./components/FieldSearch";
import Header from "./components/Header";

import React, { Component } from "react";
import { MuiThemeProvider } from "material-ui";
import ExportUrlApi from "./api/src/api/ExportUrlApi";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetName: "",
      enableFieldSearch: false,
      facets: null,
      totalCount: null,
      filter: null,
      extraFacets: null
    };

    this.apiClient = new ApiClient();
    this.apiClient.basePath = "/api";
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

    this.fieldsApi = new FieldsApi(this.apiClient);
    this.fieldsCallback = function(error, data) {
      if (error) {
        console.error(error);
      } else {
        this.setState({
          fields: data.fields.map(field => {
            return {
              label: field.name + " - " + field.description,
              value: field.elasticsearch_name
            };
          })
        });
      }
    }.bind(this);

    // Map from facet name to a list of facet values.
    this.filterMap = new Map();
    this.updateFacets = this.updateFacets.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    if (this.state.facets == null || this.state.datasetName === "") {
      // Server has not yet responded or returned an error
      return <div />;
    } else {
      return (
        <MuiThemeProvider>
          <div className="app">
            <Header
              datasetName={this.state.datasetName}
              totalCount={this.state.totalCount}
            />
            {this.state.enableFieldSearch && (
              <FieldSearch
                fields={this.state.fields}
                handleChange={this.handleChange}
              />
            )}
            <FacetsGrid
              updateFacets={this.updateFacets}
              facets={this.state.facets}
            />
            <ExportFab
              exportUrlApi={new ExportUrlApi(this.apiClient)}
              filter={this.state.filter}
            />
          </div>
        </MuiThemeProvider>
      );
    }
  }

  componentDidMount() {
    this.fieldsApi.fieldsGet(this.fieldsCallback);
    this.facetsApi.facetsGet({}, this.facetsCallback);

    // Call /api/dataset
    let datasetApi = new DatasetApi(this.apiClient);
    let datasetCallback = function(error, data) {
      if (error) {
        // TODO: Show error in snackbar.
        console.error(error);
      } else {
        this.setState({
          datasetName: data.name,
          enableFieldSearch: data.enableFieldSearch
        });
      }
    }.bind(this);
    datasetApi.datasetGet(datasetCallback);
  }

  handleChange(selectedOption) {
    let extraFacets = [];
    selectedOption.forEach(option => extraFacets.push(option.value));
    if (extraFacets.length > 0) {
      this.setState({ extraFacets: extraFacets });
      this.facetsApi.facetsGet(
        { extraFacets: extraFacets },
        this.facetsCallback
      );
    } else {
      this.setState({ extraFacets: null });
      this.facetsApi.facetsGet({}, this.facetsCallback);
    }
  }

  /**
   * Updates the selection for a single facet value and refreshes the facets data from the server.
   * @param facetName string containing the name of the facet corresponding to this value
   * @param facetValue string containing the name of this facet value
   * @param isSelected bool indicating whether this facetValue should be added to or removed from the query
   * */
  updateFacets(facetName, facetValue, isSelected) {
    let currentFacetValues = this.filterMap.get(facetName);
    if (isSelected) {
      // Add facetValue to the list of filters for facetName
      if (currentFacetValues === undefined) {
        this.filterMap.set(facetName, [facetValue]);
      } else {
        currentFacetValues.push(facetValue);
      }
    } else if (this.filterMap.get(facetName) !== undefined) {
      // Remove facetValue from the list of filters for facetName
      this.filterMap.set(
        facetName,
        this.removeFacet(currentFacetValues, facetValue)
      );
    }

    let filterArray = this.filterMapToArray(this.filterMap);
    this.setState({ filter: filterArray });
    if (filterArray.length > 0) {
      this.facetsApi.facetsGet({ filter: filterArray }, this.facetsCallback);
    } else {
      this.facetsApi.facetsGet({}, this.facetsCallback);
    }
  }

  removeFacet(valueList, facetValue) {
    let newValueList = [];
    for (let i = 0; i < valueList.length; i++) {
      if (valueList[i] !== facetValue) {
        newValueList.push(valueList[i]);
      }
    }
    return newValueList;
  }

  /**
   * Converts a Map of filters to an Array of filter strings interpretable by
   * the backend
   * @param filterMap Map of facetName:[facetValues] pairs
   * @return [string] Array of "facetName=facetValue" strings
   */
  filterMapToArray(filterMap) {
    let filterArray = [];
    filterMap.forEach((values, key) => {
      // Scenario where there are no values for a key: A single value is
      // checked for a facet. The value is unchecked. The facet name will
      // still be a key in filterMap, but there will be no values.
      if (values.length > 0) {
        for (let value of values) {
          filterArray.push(key + "=" + value);
        }
      }
    });
    return filterArray;
  }
}

export default App;
