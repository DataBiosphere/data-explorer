import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import VegaLite from "react-vega-lite";
import { Handler } from "vega-tooltip";

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

const baseSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v3.json",
  config: {
    axis: {
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

class HistogramFacet extends Component {
  constructor(props) {
    super(props);
    this.isValueDimmed = this.isValueDimmed.bind(this);
    this.onNewView = this.onNewView.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  render() {
    const { classes } = this.props;

    const spec = Object.assign({}, baseSpec);
    let facetValueNames = this.props.facet.values.map(v => v.name);
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
        labelLimit: 120
      },
      scale: {
        paddingInner: 0.419,
        paddingOuter: 0,
        rangeStep: 31
      }
    };
    // Make bars horizontal, to allow for more space for facet value names for
    // categorical facets.
    spec.encoding.x = facetValueCountAxis;
    spec.encoding.y = facetValueNameAxis;

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

    // Create transparent bar that extends the entire length of the cart. This
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

    return (
      <div className={classes.histogramFacet}>
        <FacetHeader
          facet={this.props.facet}
          selectedValues={this.props.selectedValues}
        />
        {this.props.facet.values &&
          this.props.facet.values.length > 0 && (
            <div className={classes.vega}>
              <VegaLite
                spec={spec}
                data={data}
                tooltip={new Handler({ theme: "custom" }).call}
                onNewView={this.onNewView}
              />
            </div>
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
