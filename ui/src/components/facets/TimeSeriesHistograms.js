import React, { Component } from "react";
import { Handler } from "vega-tooltip";
import * as vl from "vega-lite";
import Vega from "react-vega";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import "./HistogramFacet.css";

const styles = {
  timeSeriesHistogram: {
    overflowX: "visible",
    overflowY: "auto"
  },
  vega: {
    textAlign: "center"
  }
};

// If more than 120px, facet value name will be cut off with "..."
const facetValueNameWidthLimit = 120;

function isCategorical(es_field_type) {
  return es_field_type === "text" || es_field_type === "samples_overview";
}

// From https://stackoverflow.com/questions/39342575
function maxCount(arr) {
  let maxRow = arr.map(function(row) {
    return Math.max.apply(Math, row);
  });
  return Math.max.apply(null, maxRow);
}

// Creates small multiples plots for displaying time series data. See
// https://i.imgur.com/YsAV5P6.png for an example.
class TimeSeriesHistograms extends Component {
  constructor(props) {
    super(props);
    this.isValueDimmed = this.isValueDimmed.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onNewView = this.onNewView.bind(this);
  }

  render() {
    const { classes } = this.props;

    const baseVegaLiteSpec = {
      $schema: "https://vega.github.io/schema/vega-lite/v3.json",
      usermeta: {
        embedOptions: {
          // Don't show menu with export buttons 'Save as SVG', etc.
          actions: false
        }
      },
      config: {
        axis: {
          // Config that applies to both axes go here
          domainColor: "#aeb3ba",
          gridColor: "#ebedef",
          labelColor: colors.dark(),
          labelFont: "Montserrat",
          labelFontWeight: 500,
          labelPadding: 9,
          ticks: false
        },
        facet: {
          spacing: 8
        }
      },
      encoding: {
        color: {
          field: "dimmed",
          type: "nominal",
          scale: {
            range: [
              // Default bar color
              "#4cabd4",
              // Unselected bar
              "#bfe1f0"
            ]
          },
          legend: null
        },
        tooltip: {
          field: "text",
          type: "nominal"
        },
        x: {},
        y: {},
        column: {},
        // opacity is needed for creating transparent bars.
        opacity: {
          field: "opaque",
          type: "nominal",
          scale: {
            range: [0, 1]
          },
          legend: null
        }
      },
      mark: {
        type: "bar",
        cursor: "pointer"
      },
      padding: {
        left: 11,
        top: 17,
        right: 30,
        bottom: 16
      },
      width: 50
    };

    let facetValueNames = this.props.facet.value_names.slice();
    const vegaLiteSpec = Object.assign({}, baseVegaLiteSpec);
    if (!isCategorical(this.props.facet.es_field_type)) {
      // For numeric facets, higher numbers should be higher on the y-axis
      facetValueNames.reverse();
    }

    const facetValueNameAxis = {
      field: "facet_value",
      type: "nominal",
      title: this.props.facet.name,
      sort: facetValueNames,
      axis: {
        labelFontSize: 12,
        labelLimit: facetValueNameWidthLimit,
        titleColor: colors.dark(),
        titleFont: "Montserrat",
        titleFontWeight: 500,
        titleFontSize: 14,
        titlePadding: 20
      },
      scale: {
        // Bar height (18px) + whitespace height (13px) = 31px
        rangeStep: 31,
        // Proportion of step that is whitespace; 13/31 = .42
        paddingInner: 0.42,
        // There should be 7 pixels of whitespace under bottom bar
        //. 7/31/2 ~= .12
        paddingOuter: 0.12
      }
    };

    const facetValueCountAxis = {
      axis: {
        labels: false
      },
      field: "count",
      type: "quantitative",
      title: "",
      stack: null
    };

    const facetValueTimeAxis = {
      field: "time_series_value",
      type: "nominal",
      title: this.props.timeSeriesUnit,
      header: {
        labelColor: colors.dark(),
        labelFont: "Montserrat",
        labelFontWeight: 500,
        labelFontSize: 12,
        labelPadding: 12,
        labelOrient: "bottom",
        titleColor: colors.dark(),
        titleFont: "Montserrat",
        titleFontWeight: 500,
        titleFontSize: 14,
        titlePadding: 8,
        titleOrient: "bottom"
      }
    };

    // Make bars horizontal, to allow for more space for facet value names for
    // categorical facets.
    vegaLiteSpec.encoding.x = facetValueCountAxis;
    vegaLiteSpec.encoding.y = facetValueNameAxis;
    vegaLiteSpec.encoding.column = facetValueTimeAxis;

    const data = { values: [] };
    for (let ti = 0; ti < this.props.facet.time_names.length; ti++) {
      for (let vi = 0; vi < this.props.facet.value_names.length; vi++) {
        let name = this.props.facet.value_names[vi];
        let count = this.props.facet.time_series_value_counts[ti][vi];
        let time = this.props.facet.time_names[ti];
        // To compute elasticsearch field name with this time, need to
        // replace decimal point with underscore as is done in the
        // index.
        let tsv_es_field_name =
          this.props.facet.es_field_name + "." + time.replace(".", "_");
        data.values.push({
          facet_value: name,
          count: count,
          time_series_value: time === "Unknown" ? time : parseFloat(time),
          tsv_es_field_name: tsv_es_field_name,
          dimmed: this.isValueDimmed(name, tsv_es_field_name),
          text: `${name}: ${count}`,
          opaque: true
        });
      }
    }

    // Create transparent bar that extends the entire length of the chart. This
    // makes tooltip/selection easier for facet values that have very low count.
    let maxFacetValue = maxCount(this.props.facet.time_series_value_counts);
    data.values = data.values.concat(
      data.values.map(v => {
        const invisible = Object.assign({}, v);
        invisible.opaque = false;
        invisible.count = maxFacetValue;
        return invisible;
      })
    );

    // vega-lite spec is easier to construct than vega spec. But certain
    // properties aren't available in vega-lite spec (vega-lite is a subset of
    // vega). So construct vega-lite spec, compile to vega spec, edit properties
    // that are only available in vega, then render Vega component.
    vegaLiteSpec.data = data;
    const vegaSpec = vl.compile(vegaLiteSpec).spec;

    // Setting align removes whitespace over top bar.
    // When https://github.com/vega/vega-lite/issues/4741 is fixed, set align
    // normally.
    vegaSpec.scales[1].align = 0;

    let vega = (
      <Vega
        spec={vegaSpec}
        tooltip={new Handler({ theme: "custom" }).call}
        onNewView={this.onNewView}
      />
    );

    return (
      <div className={classes.timeSeriesHistogram}>
        <div className={classes.vega}> {vega} </div>
      </div>
    );
  }

  isValueDimmed(facetValueName, tsv_es_field_name) {
    let selectedValues = this.props.selectedFacetValues.get(tsv_es_field_name);
    return (
      selectedValues != null &&
      selectedValues.length > 0 &&
      !selectedValues.includes(facetValueName)
    );
  }

  onClick(event, item) {
    // Ignore clicks which are not located on histogram
    // bars.
    if (item && item.datum && item.datum.facet_value) {
      let selectedValues = this.props.selectedFacetValues.get(
        item.datum.tsv_es_field_name
      );
      // facetValue is a string, eg "female"
      // If bar was clicked, item.datum.facet_value is populated.
      // If axis label was clicked, item.datum.value is populated.
      const facetValue =
        "facet_value" in item.datum ? item.datum.facet_value : item.datum.value;
      let isSelected;
      // selectedValues contains what was selected before the click.
      // isSelected contains if facet value was selected after the click.
      if (
        selectedValues != null &&
        selectedValues.length > 0 &&
        selectedValues.includes(facetValue)
      ) {
        isSelected = false;
      } else {
        isSelected = true;
      }

      this.props.updateFacets(
        item.datum.tsv_es_field_name,
        facetValue,
        isSelected
      );
    }
  }

  onNewView(view) {
    view.addEventListener("click", this.onClick);
  }
}

export default withStyles(styles)(TimeSeriesHistograms);
