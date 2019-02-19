import React, { Component } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

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

const theme = createMuiTheme({
  typography: {
    fontFamily: ["Montserrat", "sans-serif"].join(",")
  }
});

const Disclaimer = (
  <Typography style={{ margin: "27px 27px 0px 27px" }}>
    This dataset is publicly available for anyone to use under the terms
    provided by the dataset source (
    <a href="http://www.internationalgenome.org/data">
      http://www.internationalgenome.org/data
    </a>
    ) and are provided "AS IS" without any warranty, express or implied, from
    Verily Life Sciences, LLC. Verily Life Sciences, LLC disclaims all liability
    for any damages, direct or indirect, resulting from the use of the dataset.
  </Typography>
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetName: "",
      // What to show in search box by default. If this is the empty string, the
      // react-select default of "Select..." is shown.
      searchPlaceholderText: "",
      // Can be "text" or "viz"
      facetType: "viz",
      // Map from es_field_name to facet data returned from API server /facets call.
      facets: new Map(),
      totalCount: null,
      // Map from es_field_name to a list of selected facet values.
      selectedFacetValues: new Map(),
      // These represent extra facets added via the search box.
      // This is an array of Elasticsearch field names
      extraFacetEsFieldNames: [],
      // Search results shown in the search drop-down.
      // This is an array of dicts, where each dict has
      // facetName - The name of the facet.
      // facetDescription - The description of the facet.
      // esFieldName - The elasticsearch field name of the facet.
      // facetValue
      searchResults: [],
      awaitingFacetsApi: false
    };

    this.apiClient = new ApiClient();
    this.apiClient.basePath = "/api";
    this.facetsApi = new FacetsApi(this.apiClient);
    this.facetsCallback = function(error, data) {
      if (error) {
        this.setState({ awaitingFacetsApi: false });
        console.error(error);
        // TODO(alanhwang): Redirect to an error page
      } else {
        this.setState({
          facets: this.getFacetMap(data.facets),
          totalCount: data.count,
          awaitingFacetsApi: false
        });
      }
    }.bind(this);

    this.searchApi = new SearchApi(this.apiClient);

    this.searchCallback = function(error, data) {
      if (error) {
        console.error(error);
      } else {
        let search_results = data.search_results.map(result => {
          return {
            facetName: result.facet_name,
            facetDescription: result.facet_description,
            esFieldName: result.elasticsearch_field_name,
            facetValue: result.facet_value
          };
        });
        this.setState({
          searchResults: search_results
        });
      }
    }.bind(this);

    // debounce so we don't call API server query after every letter; only after a pause in typing
    this.loadOptions = debounce((inputValue, callback) => {
      // axios is needed to avoid setTimeout from react-select examples at https://react-select.com/async.
      let apiUrl = this.apiClient.buildUrl("search?query=" + inputValue);
      axios
        .get(`${apiUrl}`)
        .then(({ data }) => {
          var result = data.search_results.map(searchResult => {
            return {
              facetName: searchResult.facet_name,
              facetDescription: searchResult.facet_description,
              esFieldName: searchResult.elasticsearch_field_name,
              facetValue: searchResult.facet_value
            };
          });
          callback(result);
        })
        .catch(error => callback(error, null));
    }, 500).bind(this);

    this.updateFacets = this.updateFacets.bind(this);
    this.handleSearchBoxChange = this.handleSearchBoxChange.bind(this);
    this.handleVizToggleChange = this.handleVizToggleChange.bind(this);
    this.loadOptions = this.loadOptions.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !nextState.awaitingFacetsApi;
  }

  render() {
    if (this.state.facets.size == 0 || this.state.datasetName === "") {
      // Server has not yet responded or returned an error
      return <div />;
    } else {
      return (
        <MuiThemeProvider theme={theme}>
          <div style={{ backgroundColor: "#e5e5e5" }}>
            <Header
              datasetName={this.state.datasetName}
              totalCount={this.state.totalCount}
              facetType={this.state.facetType}
              handleVizToggleChange={this.handleVizToggleChange}
            />

            <Search
              searchPlaceholderText={this.state.searchPlaceholderText}
              defaultOptions={this.state.searchResults}
              handleSearchBoxChange={this.handleSearchBoxChange}
              selectedFacetValues={this.state.selectedFacetValues}
              facets={this.state.facets}
              loadOptions={this.loadOptions}
            />
            <FacetsGrid
              updateFacets={this.updateFacets}
              selectedFacetValues={this.state.selectedFacetValues}
              facets={Array.from(this.state.facets.values())}
              facetType={this.state.facetType}
            />
            <ExportFab
              exportUrlApi={new ExportUrlApi(this.apiClient)}
              filter={this.filterMapToArray(this.state.selectedFacetValues)}
            />
            {this.state.datasetName == "1000 Genomes" ? Disclaimer : null}
          </div>
        </MuiThemeProvider>
      );
    }
  }

  componentDidMount() {
    this.searchApi.searchGet({}, this.searchCallback);
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
          searchPlaceholderText: data.search_placeholder_text
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
    if (action.action == "clear") {
      // x on right of search box was clicked.
      this.setState({ selectedFacetValues: new Map() });
      this.facetsApi.facetsGet(
        {
          filter: this.filterMapToArray(new Map()),
          extraFacets: this.state.extraFacetEsFieldNames
        },
        this.facetsCallback
      );
    } else if (action.action == "remove-value") {
      // chip x was clicked.
      let parts = action.removedValue.value.split("=");
      this.updateFacets(parts[0], parts[1], false);
    } else if (action.action == "select-option") {
      let option = action.option;
      // Drop-down row was clicked.
      let newExtraFacetEsFieldNames = this.state.extraFacetEsFieldNames;
      newExtraFacetEsFieldNames.push(option.esFieldName);

      let selectedFacetValues = this.state.selectedFacetValues;
      if (option.facetValue != "") {
        selectedFacetValues = this.updateSelectedFacetValues(
          option.esFieldName,
          option.facetValue,
          true
        );
      }

      this.facetsApi.facetsGet(
        {
          filter: this.filterMapToArray(selectedFacetValues),
          extraFacets: newExtraFacetEsFieldNames
        },
        function(error, data) {
          this.facetsCallback(error, data);
          this.setState({
            // Set selectedFacetValues state after facetsCallback.
            // If it were set before, the relevant facet might not yet be in extraFacetEsFieldsNames.
            selectedFacetValues: selectedFacetValues,
            extraFacetEsFieldNames: newExtraFacetEsFieldNames
          });
        }.bind(this)
      );
    }
  }

  // Return new selectedFacetValues representing current state and the facet value that was just de/selected
  updateSelectedFacetValues(esFieldName, facetValue, isSelected) {
    let allFacetValues = this.state.selectedFacetValues;
    let facetValuesForField = allFacetValues.get(esFieldName);
    if (isSelected) {
      // Add facetValue to the list of filters for facetName
      if (facetValuesForField === undefined) {
        allFacetValues.set(esFieldName, [facetValue]);
      } else if (!facetValuesForField.includes(facetValue)) {
        facetValuesForField.push(facetValue);
      }
    } else if (allFacetValues.get(esFieldName) !== undefined) {
      // Remove facetValue from the list of filters for facetName
      allFacetValues.set(
        esFieldName,
        this.removeFacetValue(facetValuesForField, facetValue)
      );
    }
    return allFacetValues;
  }

  /**
   * Updates the selection for a single facet value and refreshes the facets data from the server.
   * */
  updateFacets(esFieldName, facetValue, isSelected) {
    let selectedFacetValues = this.updateSelectedFacetValues(
      esFieldName,
      facetValue,
      isSelected
    );
    // Update the state
    this.setState({
      selectedFacetValues: selectedFacetValues,
      awaitingFacetsApi: true
    });
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

  handleVizToggleChange(event, facetType) {
    if (facetType) {
      this.setState({ facetType: facetType });
    } else {
      // If text button is selected and user clicks on text button again, by
      // default the text button will unselect (and no buttons will be
      // selected). Make it so that text button remains selected. For us, at
      // least one of the buttons must be selected.
      this.setState({ facetType: event.currentTarget.value });
    }
  }
}

export default App;
