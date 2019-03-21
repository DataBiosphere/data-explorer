import React, { Component } from "react";
import { canvas } from "vega-canvas";
import { Handler } from "vega-tooltip";
import * as vl from "vega-lite";
import Vega from "react-vega";
import { withStyles } from "@material-ui/core/styles";

import "./HistogramFacet.css";
import * as Style from "libs/style";
import colors from "libs/colors";
import FacetHeader from "components/facets/FacetHeader";

const styles = {
  histogramFacet: {
    ...Style.elements.card,
    margin: "0 25px 28px 0",
    maxHeight: "500px",
    overflowY: "auto",
    padding: 0
  },
  vega: {
    textAlign: "center"
  }
};

// If more than 120px, facet value name will be cut off with "..."
const facetValueNameWidthLimit = 120;

const baseVegaLiteSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v3.json",
  config: {
    // Config that applies to both axes go here
    axis: {
      domainColor: colors.gray[4],
      gridColor: colors.gray[6],
      labelColor: colors.gray[0],
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
          colors.blue[2],
          // Unselected bar
          colors.blue[5]
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

const facetValueCountAxis = {
  axis: {
    labelFontSize: 10
  },
  field: "count",
  type: "quantitative",
  title: "",
  stack: null
};

function isCategorical(facet) {
  return (
    facet.es_field_type == "text" || facet.es_field_type == "samples_overview"
  );
}

// Make vega chart fill up facet horizontally.
// By default, chart width -- just the bars, not including text -- is 200px.
// If facet value names are short, there is more whitespace to left of chart:
// https://i.imgur.com/I5A6EUn.png
// This method increases chart width in those cases:
// https://i.imgur.com/JSKHSkS.png
function setWidth(facetValueNames) {
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

class HistogramFacet extends Component {
  constructor(props) {
    super(props);
    this.isValueDimmed = this.isValueDimmed.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onNewView = this.onNewView.bind(this);
  }

  render() {
    const { classes } = this.props;

    let facetValueNames = this.props.facet.values.map(v => v.name);
    setWidth(facetValueNames);

    const vegaLiteSpec = Object.assign({}, baseVegaLiteSpec);
    if (!isCategorical(this.props.facet)) {
      // For numeric facets, higher numbers should be higher on the y-axis
      facetValueNames.reverse();
    }
    const facetValueNameAxis = {
      field: "facet_value",
      type: "nominal",
      title: null,
      sort: facetValueNames,
      axis: {
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
    // Make bars horizontal, to allow for more space for facet value names for
    // categorical facets.
    vegaLiteSpec.encoding.x = facetValueCountAxis;
    vegaLiteSpec.encoding.y = facetValueNameAxis;

    const data = {
      values: this.props.facet.values.map(v => {
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
    const maxFacetValue = Math.max(...data.values.map(v => v.count));
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

    // Add tooltips to axis labels. vega-lite spec doesn't have "encode".
    // May be able to simplify after https://github.com/vega/vega/issues/1719
    // is fixed.
    let facetValueIndexStr = "";
    if (isCategorical(this.props.facet)) {
      facetValueIndexStr =
        "round((isNaN(datum.index)?0:datum.index) * (length(data('source_0'))/2 - 1))";
    } else {
      // For numeric facets, facet value counts are in reverse order
      facetValueIndexStr =
        "length(data('source_0'))/2 - 1 - round((isNaN(datum.index)?0:datum.index) * (length(data('source_0'))/2 - 1))";
    }
    const signalStr =
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

    return (
      <div className={classes.histogramFacet}>
        <FacetHeader
          facet={this.props.facet}
          selectedValues={this.props.selectedValues}
        />
        {this.props.facet.values && this.props.facet.values.length > 0 && (
          <div className={classes.vega}> {vega} </div>
        )}
      </div>
    );
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
      const facetValue = item.datum.facet_value;
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

      this.props.updateFacets(
        this.props.facet.es_field_name,
        facetValue,
        isSelected
      );
    }
  }

  onNewView(view) {
    view.addEventListener("click", this.onClick);
  }
}

export default withStyles(styles)(HistogramFacet);
