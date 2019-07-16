import React, { Component } from "react";
import { canvas } from "vega-canvas";
import { Handler } from "vega-tooltip";
import * as vl from "vega-lite";
import Vega from "react-vega";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import "./HistogramFacet.css";

const styles = {
  vega: {
    textAlign: "center"
  }
};

// If more than 120px, facet value name will be cut off with "..."
const facetValueNameWidthLimit = 120;

function isCategorical(es_field_type) {
  return es_field_type === "text" || es_field_type === "samples_overview";
}

// Make vega chart fill up facet horizontally.
// By default, chart width -- just the bars, not including text -- is 200px.
// If facet value names are short, there is more whitespace to left of chart:
// https://i.imgur.com/I5A6EUn.png
// This method increases chart width in those cases:
// https://i.imgur.com/JSKHSkS.png
function setWidth(facetValueNames, baseVegaLiteSpec) {
  const defaultChartWidth = 200;
  const context = canvas(1, 1).getContext("2d");
  const nameWidths = facetValueNames.map(n => context.measureText(n).width);
  const maxNameWidth_currentFacet = Math.max(...nameWidths);
  if (maxNameWidth_currentFacet > facetValueNameWidthLimit) {
    baseVegaLiteSpec.width = defaultChartWidth;
  } else {
    baseVegaLiteSpec.width =
      defaultChartWidth + facetValueNameWidthLimit - maxNameWidth_currentFacet;
  }
}

class HistogramPlot extends Component {
  constructor(props) {
    // props has:
    // es_field_name (from facet.es_field_name)
    // es_field_type (from facet.es_field_type)
    // values (from facet.values)
    // selectedValues (from selectedValues or from query into selectedFacetValues)
    // updateFacets (from updateFacets)
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
        // Config that applies to both axes go here
        axis: {
          domainColor: "#aeb3ba",
          gridColor: "#ebedef",
          labelColor: colors.dark(),
          labelFont: "Montserrat",
          labelFontWeight: 500,
          labelPadding: 9,
          ticks: false
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
        left: 0,
        top: 17,
        right: 0,
        bottom: 16
      }
    };

    let facetValueNames = this.props.values.map(v => v.name);
    setWidth(facetValueNames, baseVegaLiteSpec);

    const vegaLiteSpec = Object.assign({}, baseVegaLiteSpec);
    if (!isCategorical(this.props.es_field_type)) {
      // For numeric facets, higher numbers should be higher on the y-axis
      facetValueNames.reverse();
    }
    const facetValueNameAxis = {
      field: "facet_value",
      type: "nominal",
      title: null,
      sort: facetValueNames,
      axis: {
        labels: true,
        labelFontSize: 12,
        labelLimit: facetValueNameWidthLimit
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
        labels: true,
        labelFontSize: 10
      },
      field: "count",
      type: "quantitative",
      title: "",
      stack: null
    };

    // Make bars horizontal, to allow for more space for facet value names for
    // categorical facets.
    vegaLiteSpec.encoding.x = facetValueCountAxis;
    vegaLiteSpec.encoding.y = facetValueNameAxis;

    const data = {
      values: this.props.values.map(v => {
        return {
          facet_value: v.name,
          count: v.count,
          dimmed: this.isValueDimmed(v),
          text: `${v.name}: ${v.count}`,
          opaque: true
        };
      })
    };

    // Create transparent bar that extends the entire length of the chart. This
    // makes tooltip/selection easier for facet values that have very low count.
    const maxFacetValue =
      "maxFacetValue" in this.props
        ? this.props.maxFacetValue
        : Math.max(...data.values.map(v => v.count));
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

    // Add tooltips to axis labels. If you hover over "Has WGS Low Cov...",
    // tooltip is "Has WGS Low Coverage BAM: 2535".
    // vega-lite spec doesn't have "encode", so modify vega spec.
    // Unfortunately constructing the tooltip is more complicated than the bar
    // tooltip, because facet value count is not readily available.
    // We have access to facet data in data('source_0'); see
    // https://i.imgur.com/TICTYgA.png
    // Each axis label has an index from 0 to 1
    // (https://i.imgur.com/2ILXv9a.png). If there are 4 facet values, indexes
    // are: 0, 1/3, 2/3, 3/3.
    // facetValueIndexStr converts from float to integer (0, 1, 2, 3).
    // - isNaN can be deleted when we're using a vega version with
    //   https://github.com/vega/vega/pull/1720
    // - We divide by 2 because there are actually two entries in
    //   data('source_0') for each facet value. One for the blue bar, and one
    //   for a transparent bar. (The transparent bar lets us show tooltip for
    //   when blue bar is small/non-existent.)
    // - We subtract 1 because the floats are 0,1/3,2/3,3/3, not 0,1/4,2/4, etc.
    // - See https://github.com/vega/vega/issues/1719 (second issue) for why we
    //   need round().
    let facetValueIndexStr = "";
    if (isCategorical(this.props.es_field_type)) {
      facetValueIndexStr =
        "round((isNaN(datum.index)?0:datum.index) * (length(data('source_0'))/2 - 1))";
    } else {
      // For numeric facets, facet value counts are in reverse order.
      // So instead of 0,1,2,3 we need 3,2,1,0.
      facetValueIndexStr =
        "length(data('source_0'))/2 - 1 - round((isNaN(datum.index)?0:datum.index) * (length(data('source_0'))/2 - 1))";
    }
    const signalStr =
      // Now we can construct tooltip: facet value name: facet value count
      "datum.value + ': ' + data('source_0')[" + facetValueIndexStr + "].count";
    vegaSpec.axes[2].encode = {
      labels: {
        interactive: true,
        update: {
          tooltip: {
            signal: signalStr
          }
        }
      }
    };

    let vega = (
      <Vega
        spec={vegaSpec}
        tooltip={new Handler({ theme: "custom" }).call}
        onNewView={this.onNewView}
      />
    );

    return <div className={classes.vega}> {vega} </div>;
  }

  isValueDimmed(facetValue) {
    return (
      this.props.selectedValues != null &&
      this.props.selectedValues.length > 0 &&
      !this.props.selectedValues.includes(facetValue.name)
    );
  }

  onClick(event, item) {
    // Ignore clicks which are not located on histogram
    // bars.
    if (item && item.datum) {
      // facetValue is a string, eg "female"
      // If bar was clicked, item.datum.facet_value is populated.
      // If axis label was clicked, item.datum.value is populated.
      const facetValue =
        "facet_value" in item.datum ? item.datum.facet_value : item.datum.value;
      let isSelected;
      // this.props.selectedValues contains what was selected before the click.
      // isSelected contains if facet value was selected after the click.
      if (
        this.props.selectedValues != null &&
        this.props.selectedValues.length > 0 &&
        this.props.selectedValues.includes(facetValue)
      ) {
        isSelected = false;
      } else {
        isSelected = true;
      }

      this.props.updateFacets(this.props.es_field_name, facetValue, isSelected);
    }
  }

  onNewView(view) {
    view.addEventListener("click", this.onClick);
  }
}

export default withStyles(styles)(HistogramPlot);
