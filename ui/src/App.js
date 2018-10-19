import React, { Component } from "react";

import "App.css";
import {
  ApiClient,
  DatasetApi,
  FacetsApi,
  FieldsApi
} from "data_explorer_service";
import ExportFab from "components/ExportFab";
import ExportUrlApi from "api/src/api/ExportUrlApi";
import FacetsGrid from "components/facets/FacetsGrid";
import FieldSearch from "components/FieldSearch";
import Header from "components/Header";

const Disclaimer = (
  <div style={{ margin: "20px" }}>
    This dataset is publicly available for anyone to use under the terms
    provided by the dataset source (<a href="http://www.internationalgenome.org/data">
      http://www.internationalgenome.org/data
    </a>) and are provided "AS IS" without any warranty, express or implied,
    from Verily Life Sciences, LLC. Verily Life Sciences, LLC disclaims all
    liability for any damages, direct or indirect, resulting from the use of the
    dataset.
  </div>
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetName: "",
      enableFieldSearch: false,
      facets: null,
      totalCount: null,
      filter: null,
      // These are all fields which can be searched using field search.
      // This is an array of react-select options. A react-select option
      // is an Object with value and label. See
      // https://github.com/JedWatson/react-select#installation-and-usage
      fields: [],
      // These represent fields selected via field search.
      // This is an array of react-select options.
      extraFacetsOptions: []
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
            if (field.description) {
              let display_name = field.name + " - " + field.description;
              return {
                label: display_name,
                value: field.elasticsearch_name,
                chipLabel: field.name
              };
            }
            return {
              label: field.name,
              value: field.elasticsearch_name,
              chipLabel: field.name
            };
          })
        });
      }
    }.bind(this);

    // Map from facet name to a list of facet values.
    this.filterMap = new Map();
    this.updateFacets = this.updateFacets.bind(this);
    this.handleFieldSearchChange = this.handleFieldSearchChange.bind(this);
  }

  render() {
    if (this.state.facets == null || this.state.datasetName === "") {
      // Server has not yet responded or returned an error
      return <div />;
    } else {
      return (
        <div className="app">
          <Header
            datasetName={this.state.datasetName}
            totalCount={this.state.totalCount}
          />
          {this.state.enableFieldSearch && (
            <FieldSearch
              fields={this.state.fields}
              handleChange={this.handleFieldSearchChange}
              extraFacetsOptions={this.state.extraFacetsOptions}
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
          {this.state.datasetName == "1000 Genomes" ? Disclaimer : null}
        </div>
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

  handleFieldSearchChange(extraFacetsOptions) {
    // Remove deleted facets from filter, if necessary.
    // - User adds extra facet A
    // - User checks A_val in facet A. filter is now "A=A_val"
    // - In FieldSearch component, user deletes chip for facet A. We need to
    // remove "A=A_val" from filter.
    let deletedFacets = this.state.extraFacetsOptions.filter(
      x => !extraFacetsOptions.includes(x)
    );
    deletedFacets.forEach(removed => {
      if (this.filterMap.get(removed.label) !== undefined) {
        this.filterMap.delete(removed.label);
      }
    });

    let filterArray = this.filterMapToArray(this.filterMap);
    this.setState({
      extraFacetsOptions: extraFacetsOptions,
      filter: filterArray
    });
    this.facetsApi.facetsGet(
      {
        filter: filterArray,
        extraFacets: extraFacetsOptions.map(option => option.value)
      },
      this.facetsCallback
    );
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

    this.facetsApi.facetsGet(
      {
        filter: filterArray,
        extraFacets: this.state.extraFacetsOptions.map(option => option.value)
      },
      this.facetsCallback
    );
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
