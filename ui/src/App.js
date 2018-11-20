import React, { Component } from "react";

import "App.css";
import {
  ApiClient,
  DatasetApi,
  FacetsApi,
  SearchApi
} from "data_explorer_service";
import ExportFab from "components/ExportFab";
import ExportUrlApi from "api/src/api/ExportUrlApi";
import FacetsGrid from "components/facets/FacetsGrid";
import Search from "components/Search";
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
      // A dict from es_field_name to facet data returned from API server /facets call.
      facets: new Map(),
      totalCount: null,
      // Map from facet name to a list of selected facet values.
      selectedFacetValues: new Map(),
      // Search results shown in the search drop-down.
      // This is an array of dicts, where each dict has
      // facetName - The name of the facet.
      // facetDescription - The description of the facet.
      // esFieldName - The elasticsearch field name of the facet.
      // facetValue
      // See https://github.com/JedWatson/react-select#installation-and-usage
      searchResults: [],
      // These represent extra facets added via the search box.
      // This is an array of Elasticsearch field names
      extraFacetEsFieldNames: []
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
          facets: this.getFacetMap(data.facets),
          totalCount: data.count
        });
      }
    }.bind(this);

    this.searchApi = new SearchApi(this.apiClient);
    this.searchCallback = function(error, data) {
      if (error) {
        console.error(error);
      } else {
        this.setState({
          searchResults: data.search_results.map(searchResult => {
            return {
              facetName: searchResult.facet_name,
              facetDescription: searchResult.facet_description,
              esFieldName: searchResult.elasticsearch_field_name,
              facetValue: searchResult.facet_value
            };
          })
        });
      }
    }.bind(this);

    this.updateFacets = this.updateFacets.bind(this);
    this.handleSearchBoxChange = this.handleSearchBoxChange.bind(this);
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
          <Search
            searchResults={this.state.searchResults}
            handleSearch={this.handleSearchBoxChange}
            selectedFacetValues={this.state.selectedFacetValues}
            facets={this.state.facets}
          />
          <FacetsGrid
            updateFacets={this.updateFacets}
            selectedFacetValues={Array.from(
              this.state.selectedFacetValues.entries()
            )}
            facets={Array.from(this.state.facets.values())}
          />
          <ExportFab
            exportUrlApi={new ExportUrlApi(this.apiClient)}
            filter={this.filterMapToArray(this.state.selectedFacetValues)}
          />
          {this.state.datasetName == "1000 Genomes" ? Disclaimer : null}
        </div>
      );
    }
  }

  componentDidMount() {
    this.searchApi.searchGet(this.searchCallback);
    this.facetsApi.facetsGet({}, this.facetsCallback);

    // Call /api/dataset
    let datasetApi = new DatasetApi(this.apiClient);
    let datasetCallback = function(error, data) {
      if (error) {
        // TODO: Show error in snackbar.
        console.error(error);
      } else {
        this.setState({
          datasetName: data.name
        });
      }
    }.bind(this);
    datasetApi.datasetGet(datasetCallback);
  }

  getFacetMap(facets) {
    var facetMap = new Map();
    facets.forEach(function(facet) {
      facetMap.set(facet.es_field_name, facet);
    });
    return facetMap;
  }

  handleSearchBoxChange(selectedOptions, action) {
    // selectedOptions is a list. The last element of the list is the drop-down row that was just selected.
    // The last element is a dict with esFieldName, facetName, facetValue (optional), and facetDescription (optional).
    let extraFacetEsFieldNames = this.state.extraFacetEsFieldNames;
    if (action.action == "clear") {
      // x on right of search box was clicked.
      this.setState({ selectedFacetValues: new Map() });
    } else if (action.action == "remove-value") {
      // chip x was clicked.
      // selectedOptions contains remaining selected facet values (ie remaining chips).
      // An array of existing selected facet values, of the form esFieldName=facetValue.
      let removedValue = action.removedValue;
      let parts = removedValue.value.split("=");
      this.updateFacets(parts[0], parts[1], false);
    } else if (action.action == "select-option") {
      // Drop-down row was clicked.
      // selectedOptions contains current chips, plus one additional element representing the drop-down row that was clicked.
      extraFacetEsFieldNames.push(action.option.esFieldName);
    }

    this.facetsApi.facetsGet(
      {
        filter: this.filterMapToArray(this.state.selectedFacetValues),
        extraFacets: extraFacetEsFieldNames
      },
      this.facetsCallback
    );
  }

  /**
   * Updates the selection for a single facet value and refreshes the facets data from the server.
   * @param esFieldName string containing the elasticsearch field name of the facet corresponding to this value
   * @param facetValue string containing the name of this facet value
   * @param isSelected bool indicating whether this facetValue should be added to or removed from the query
   * */
  updateFacets(esFieldName, facetValue, isSelected) {
    let currentFilterMap = this.state.selectedFacetValues;
    let currentFacetValues = currentFilterMap.get(esFieldName);
    if (isSelected) {
      // Add facetValue to the list of filters for facetName
      if (currentFacetValues === undefined) {
        currentFilterMap.set(esFieldName, [facetValue]);
      } else {
        currentFacetValues.push(facetValue);
      }
    } else if (currentFilterMap.get(esFieldName) !== undefined) {
      // Remove facetValue from the list of filters for facetName
      currentFilterMap.set(
        esFieldName,
        this.removeFacetValue(currentFacetValues, facetValue)
      );
    }
    // Update the state
    this.setState({ selectedFacetValues: currentFilterMap });

    // Update the facets grid.
    this.facetsApi.facetsGet(
      {
        filter: this.filterMapToArray(this.state.selectedFacetValues),
        extraFacets: this.state.extraFacetEsFieldNames
      },
      this.facetsCallback
    );
  }

  // Remove the given facet value from a list of facet values.
  removeFacetValue(valueList, facetValue) {
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
   * @param filterMap Map of esFieldName:[facetValues] pairs
   * @return [string] Array of "esFieldName=facetValue" strings
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
