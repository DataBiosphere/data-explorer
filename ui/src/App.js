import React, { Component } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import {
  MuiThemeProvider,
  createMuiTheme,
  withStyles
} from "@material-ui/core/styles";

import {
  ApiClient,
  DatasetApi,
  FacetsApi,
  SearchApi
} from "data_explorer_service";
import colors from "libs/colors";
import DeHeader from "components/DeHeader";
import ExportFab from "components/ExportFab";
import ExportUrlApi from "api/src/api/ExportUrlApi";
import FacetsGrid from "components/facets/FacetsGrid";
import TerraHeader from "components/TerraHeader";
import Montserrat from "libs/fonts/Montserrat-Medium.woff2";

const styles = {
  disclaimer: {
    color: colors.gray[3],
    fontSize: 14,
    padding: "15px 15px 5px 15px"
  },
  disclaimerLink: {
    color: colors.green[0],
    textDecoration: "none"
  },
  root: {
    backgroundColor: colors.grayBlue[6],
    // 1) overflow-x=hidden is needed to disable horizontal scrollbar.
    // Horizontal scrollbar appears because each HistogramFacet has right
    // margin, including right-most HistogramFacets.
    // 2) With overflow-x=hidden, horizontal scrollbar disappears but with some
    // datasets (not 1000 Genomes) there are 2 vertical scrollbars.
    // overflow=hidden gets us down to one vertical scrollbar.
    overflow: "hidden"
  }
};

const theme = createMuiTheme({
  typography: {
    fontFamily: ["Montserrat", "sans-serif"].join(","),
    useNextVariants: true
  }
});

const Disclaimer = function(classes) {
  return (
    <div className={classes.disclaimer}>
      This dataset is publicly available for anyone to use under the terms
      provided by the dataset source (
      <a
        href="http://www.internationalgenome.org/data"
        className={classes.disclaimerLink}
      >
        http://www.internationalgenome.org/data
      </a>
      ) and are provided "AS IS" without any warranty, express or implied, from
      Verily Life Sciences, LLC. Verily Life Sciences, LLC disclaims all
      liability for any damages, direct or indirect, resulting from the use of
      the dataset.
    </div>
  );
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      datasetName: "",
      // What to show in search box by default. If this is the empty string, the
      // react-select default of "Select..." is shown.
      searchPlaceholderText: "",
      // Whether to show visualization facets or text facets
      showViz: true,
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
      facetsApiDone: false,
      fontLoaded: false
    };

    this.apiClient = new ApiClient();
    this.apiClient.basePath = "/api";
    this.facetsApi = new FacetsApi(this.apiClient);
    this.facetsCallback = function(error, data) {
      if (error) {
        this.setState({ facetsApiDone: true });
        console.error(error);
      } else {
        this.setState({
          facetsApiDone: true,
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
    this.handleSearchBoxTyping = debounce((inputValue, callback) => {
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

    this.loadFont();

    this.updateFacets = this.updateFacets.bind(this);
    this.handleSearchBoxChange = this.handleSearchBoxChange.bind(this);
    this.handleSearchBoxTyping = this.handleSearchBoxTyping.bind(this);
    this.handleVizSwitchChange = this.handleVizSwitchChange.bind(this);
    this.handleRemoveFacet = this.handleRemoveFacet.bind(this);
    this.filterArrayToMap = this.filterArrayToMap.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.facetsApiDone && nextState.fontLoaded;
  }

  render() {
    const { classes } = this.props;

    if (this.state.facets.size === 0 || this.state.datasetName === "") {
      // Server has not yet responded or returned an error
      return <div />;
    } else {
      return (
        <MuiThemeProvider theme={theme}>
          <div className={classes.root}>
            <TerraHeader
              datasetName={this.state.datasetName}
              totalCount={this.state.totalCount}
              showViz={this.state.showViz}
              handleVizSwitchChange={this.handleVizSwitchChange}
            />
            <DeHeader
              datasetName={this.state.datasetName}
              facets={this.state.facets}
              handleSearchBoxChange={this.handleSearchBoxChange}
              handleSearchBoxTyping={this.handleSearchBoxTyping}
              handleVizSwitchChange={this.handleVizSwitchChange}
              searchPlaceholderText={this.state.searchPlaceholderText}
              searchResults={this.state.searchResults}
              selectedFacetValues={this.state.selectedFacetValues}
              showViz={this.state.showViz}
              totalCount={this.state.totalCount}
            />
            <FacetsGrid
              updateFacets={this.updateFacets}
              selectedFacetValues={this.state.selectedFacetValues}
              facets={Array.from(this.state.facets.values())}
              handleRemoveFacet={this.handleRemoveFacet}
              extraFacetEsFieldNames={this.state.extraFacetEsFieldNames}
              showViz={this.state.showViz}
            />
            <ExportFab
              exportUrlApi={new ExportUrlApi(this.apiClient)}
              filter={this.filterMapToArray(this.state.selectedFacetValues)}
            />
            {this.state.datasetName === "1000 Genomes"
              ? Disclaimer(classes)
              : null}
          </div>
        </MuiThemeProvider>
      );
    }
  }

  componentDidMount() {
    this.searchApi.searchGet({}, this.searchCallback);

    if (window.location.search) {
      this.handleQueryString();
    } else {
      this.callFacetsApiGet({}, this.facetsCallback);
    }

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

  loadFont() {
    // Force load font before vega rendering to prevent truncation bug. See
    // https://github.com/vega/vega/issues/1671
    // If we preloaded the font in HistogramFacet.js, then the page would render
    // in two stages: 1) header and search box, 2) facets. Preload here so the
    // entire page renders at once.
    var font = new FontFace("Montserrat", "url(" + Montserrat + ")");
    font.load().then(loadedFace => {
      document.fonts.add(loadedFace);
      this.setState({ fontLoaded: true });
    });
  }

  getFacetMap(facets) {
    var facetMap = new Map();
    facets.forEach(function(facet) {
      facetMap.set(facet.es_field_name, facet);
    });
    return facetMap;
  }

  handleSearchBoxChange(selectedOptions, action) {
    if (action.action === "clear") {
      // x on right of search box was clicked.
      this.setState({ selectedFacetValues: new Map() });
      this.callFacetsApiGet(
        {
          filter: this.filterMapToArray(new Map()),
          extraFacets: this.state.extraFacetEsFieldNames
        },
        this.facetsCallback
      );
    } else if (action.action === "remove-value") {
      // chip x was clicked.
      let parts = action.removedValue.value.split("=");
      this.updateFacets(parts[0], parts[1], false);
    } else if (action.action === "select-option") {
      let option = action.option;
      // Drop-down row was clicked.
      let newExtraFacetEsFieldNames = this.state.extraFacetEsFieldNames;
      newExtraFacetEsFieldNames.push(option.esFieldName);

      let selectedFacetValues = this.state.selectedFacetValues;
      if (option.facetValue !== "") {
        selectedFacetValues = this.updateSelectedFacetValues(
          option.esFieldName,
          option.facetValue,
          true
        );
      }

      this.callFacetsApiGet(
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
        facetValuesForField.filter(n => n !== facetValue)
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
    this.setState({
      facetsApiDone: false,
      selectedFacetValues: selectedFacetValues
    });
    this.callFacetsApiGet(
      {
        filter: this.filterMapToArray(this.state.selectedFacetValues),
        extraFacets: this.state.extraFacetEsFieldNames
      },
      this.facetsCallback
    );
  }

  handleRemoveFacet(facetValue) {
    let facetsCopy = new Map(this.state.facets);
    facetsCopy.delete(facetValue);
    let selectedFacetValues = new Map(this.state.selectedFacetValues);
    selectedFacetValues.delete(facetValue);
    let extraFacetEsFieldNames = this.state.extraFacetEsFieldNames.filter(
      n => n !== facetValue
    );
    this.setState({
      facetsApiDone: false,
      facets: facetsCopy,
      extraFacetEsFieldNames: extraFacetEsFieldNames,
      selectedFacetValues: selectedFacetValues
    });
    this.callFacetsApiGet(
      {
        filter: this.filterMapToArray(selectedFacetValues),
        extraFacets: extraFacetEsFieldNames
      },
      this.facetsCallback
    );
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

  /**
   * Converts an Array of filter strings back to a Map of filters
   * Example:
   * In: ["Gender%3Dfemale", "Gender%3Dmale", "Population%3DAmerican"]
   * Out: {"Gender" => ["male", "female"], "Population" => ["American"]}
   */
  filterArrayToMap(filterArray) {
    let filterMap = new Map();
    filterArray.forEach(function(pair) {
      pair = pair.split(encodeURIComponent("="));
      if (filterMap.has(pair[0])) {
        let arr = filterMap.get(pair[0]);
        arr.push(pair[1]);
        filterMap.set(pair[0], arr);
      } else {
        filterMap.set(pair[0], [pair[1]]);
      }
    });
    return filterMap;
  }

  handleQueryString() {
    var params = new URLSearchParams(window.location.search);
    var pipe = encodeURIComponent("|");
    var filter = params.get("filter") ? params.get("filter").split(pipe) : [];
    // filter looks like ["Gender%3Dfemale", "Gender%3Dmale", "Population%3DAmerican"]
    var extraFacets = params.get("extraFacets")
      ? params.get("extraFacets").split(pipe)
      : [];
    this.callFacetsApiGet(
      {
        filter: filter,
        extraFacets: extraFacets
      },
      function(error, data) {
        this.facetsCallback(error, data);
        this.setState({
          // Set selectedFacetValues state after facetsCallback.
          // If it were set before, the relevant facet might not yet be in extraFacetEsFieldsNames.
          selectedFacetValues: this.filterArrayToMap(filter),
          extraFacetEsFieldNames: extraFacets
        });
      }.bind(this)
    );
  }

  updateQueryString(filterParam, extraFacetsParam) {
    // If there are any params other than filter/extraFacets, leave as-is.
    var params = new URLSearchParams(window.location.search);
    params.set("filter", filterParam);
    params.set("extraFacets", extraFacetsParam);
    window.history.replaceState(null, "", "?" + params.toString());
  }

  // Wrap the call to facetsGet together with updating the query params
  callFacetsApiGet(data, facetsCallback) {
    this.facetsApi.facetsGet(data, facetsCallback);
    let extraFacetsParam = (data.extraFacets || []).join(
      encodeURIComponent("|")
    );
    let filterParam = (data.filter || [])
      .map(f => f.replace("=", encodeURIComponent("=")))
      .join(encodeURIComponent("|"));
    this.updateQueryString(filterParam, extraFacetsParam);
  }

  handleVizSwitchChange = event => {
    this.setState({ showViz: event.target.checked });
  };
}

export default withStyles(styles)(App);
