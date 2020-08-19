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
import ExportUrlApi from "api/src/api/ExportUrlApi";
import FacetsGrid from "components/facets/FacetsGrid";
import { filterArrayToMap, filterMapToArray } from "libs/util";
import TerraHeader from "components/TerraHeader";
import Montserrat from "libs/fonts/Montserrat-Medium.woff2";

const styles = {
  disclaimer: {
    color: colors.dark(),
    fontSize: 14,
    padding: "15px 15px 5px 15px"
  },
  disclaimerLink: {
    color: "#295699",
    textDecoration: "none"
  },
  root: {
    backgroundColor: "#fafbfc",
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

const ThousandGenomesDisclaimer = function(classes) {
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

const FraminghamDisclaimer = function(classes) {
  return (
    <div className={classes.disclaimer}>
      This dataset is publicly available for anyone to use under the terms
      provided by the dataset source (
      <a
        href="https://biolincc.nhlbi.nih.gov/teaching"
        className={classes.disclaimerLink}
      >
        https://biolincc.nhlbi.nih.gov/teaching
      </a>
      ) and are provided "AS IS" without any warranty, express or implied, from
      Verily Life Sciences, LLC. Verily Life Sciences, LLC disclaims all
      liability for any damages, direct or indirect, resulting from the use of
      the dataset. This is a teaching dataset and may not be used for
      publication.
    </div>
  );
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // If embed is true: DE is embedded in an iframe in Terra. Top-level URL
      // looks like https://app.terra.bio/#library/datasets/1000%20Genomes/data-explorer
      // If embed is false: DE is stand-alone. Top-level URL looks like
      // https://test-data-explorer.appspot.com
      embed: new URLSearchParams(window.location.search).has("embed"),
      datasetName: "",
      // What to show in search box by default. If this is the empty string, the
      // react-select default of "Select..." is shown.
      searchPlaceholderText: "",
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
      fontLoaded: false,
      sqlQuery: ""
      // SQL query that can be used in BigQuery to get the cohort 
      // (list of participants) of the current filter.
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
          invalidFilterFacets: data.invalid_filter_facets,
          invalidExtraFacets: data.invalid_extra_facets,
          totalCount: data.count,
          sqlQuery: data.sql_query
        });

        const pipe = encodeURIComponent("|");
        if (data.invalid_filter_facets && data.invalid_filter_facets.length) {
          // Delete invalid filter params so if user tries to save a cohort,
          // cohort won't have invalid param.
          // Also, there is no chip for invalid filter. So delete invalid parts
          // of filter param so filter param matches chips.
          const params = new URLSearchParams(window.location.search);
          const filterParam = params
            .get("filter")
            .split(pipe)
            .filter(
              filter =>
                !data.invalid_filter_facets.some(invalidFacet =>
                  filter.includes(invalidFacet)
                )
            )
            .join(encodeURIComponent("|"));
          this.updateQueryString(filterParam, params.get("extraFacets"));
        }
        if (data.invalid_extra_facets && data.invalid_extra_facets.length) {
          // Delete invalid extraFacets params so if user tries to save a cohort,
          // cohort won't have invalid param.
          const params = new URLSearchParams(window.location.search);
          const extraFacetsParam = params
            .get("extraFacets")
            .split(pipe)
            .filter(
              extraFacet => !data.invalid_extra_facets.includes(extraFacet)
            )
            .join(encodeURIComponent("|"));
          this.updateQueryString(params.get("filter"), extraFacetsParam);
        }
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
            facetValue: result.facet_value,
            isTimeSeries: result.is_time_series
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
              facetValue: searchResult.facet_value,
              isTimeSeries: searchResult.is_time_series
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
    this.handleRemoveFacet = this.handleRemoveFacet.bind(this);
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
            {!this.state.embed && (
              <TerraHeader datasetName={this.state.datasetName} />
            )}
            <DeHeader
              datasetName={this.state.datasetName}
              embed={this.state.embed}
              exportUrlApi={new ExportUrlApi(this.apiClient)}
              facets={this.state.facets}
              handleSearchBoxChange={this.handleSearchBoxChange}
              handleSearchBoxTyping={this.handleSearchBoxTyping}
              invalidFilterFacets={this.state.invalidFilterFacets}
              invalidExtraFacets={this.state.invalidExtraFacets}
              searchPlaceholderText={this.state.searchPlaceholderText}
              searchResults={this.state.searchResults}
              selectedFacetValues={this.state.selectedFacetValues}
              totalCount={this.state.totalCount}
              timeSeriesUnit={this.state.timeSeriesUnit}
              sqlQuery={this.state.sqlQuery}
            />
            <FacetsGrid
              updateFacets={this.updateFacets}
              selectedFacetValues={this.state.selectedFacetValues}
              facets={Array.from(this.state.facets.values())}
              handleRemoveFacet={this.handleRemoveFacet}
              extraFacetEsFieldNames={this.state.extraFacetEsFieldNames}
              timeSeriesUnit={this.state.timeSeriesUnit}
            />
            {this.state.datasetName === "1000 Genomes"
              ? ThousandGenomesDisclaimer(classes)
              : this.state.datasetName ===
                "Framingham Heart Study Teaching Dataset"
              ? FraminghamDisclaimer(classes)
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
          searchPlaceholderText: data.search_placeholder_text,
          timeSeriesUnit: data.time_series_unit
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
          filter: filterMapToArray(new Map()),
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
      let facetEsFieldName =
        option.isTimeSeries && option.facetValue
          ? option.esFieldName
              .split(".")
              .slice(0, -1)
              .join(".")
          : option.esFieldName;
      newExtraFacetEsFieldNames.push(facetEsFieldName);

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
          filter: filterMapToArray(selectedFacetValues),
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
        filter: filterMapToArray(this.state.selectedFacetValues),
        extraFacets: this.state.extraFacetEsFieldNames
      },
      this.facetsCallback
    );
  }

  handleRemoveFacet(facetValue) {
    let facetsCopy = new Map(this.state.facets);
    facetsCopy.delete(facetValue);
    let selectedFacetValues = new Map(this.state.selectedFacetValues);
    for (const facetValueKey of selectedFacetValues.keys()) {
      if (
        facetValueKey === facetValue ||
        facetValueKey
          .split(".")
          .slice(0, -1)
          .join(".") === facetValue
      ) {
        selectedFacetValues.delete(facetValueKey);
      }
    }
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
        filter: filterMapToArray(selectedFacetValues),
        extraFacets: extraFacetEsFieldNames
      },
      this.facetsCallback
    );
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
          selectedFacetValues: filterArrayToMap(
            filter,
            data.invalid_filter_facets
          ),
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

    // Tell Terra about new params so top-level Terra url can be updated
    if (this.state.embed && "parentIFrame" in window) {
      params.delete("embed");
      // Don't set targetOrigin because it's unknown. It could be app.terra.bio,
      // bvdp-saturn-dev.appspot.com, etc.
      window.parentIFrame.sendMessage({ deQueryStr: params.toString() });
    }
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
}

export default withStyles(styles)(App);
