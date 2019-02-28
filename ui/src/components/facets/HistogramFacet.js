import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import VegaLite from "react-vega-lite";
import { Handler } from "vega-tooltip";

import "./HistogramFacet.css";
import * as Style from "libs/style";
import FacetHeader from "components/facets/FacetHeader";

const styles = {
  histogramFacet: {
    ...Style.elements.card,
    margin: "2%",
    paddingBottom: "8px",
    // Grid is defined in TextFacet so facet value counts can appear on right,
    // in addition to total facet value count.
    // Also define here to be consistent.
    display: "grid",
    gridTemplateColumns: "auto 50px",
    maxHeight: "400px",
    overflowY: "auto"
  },
  vega: {
    gridColumn: "1 / 3",
    textAlign: "center"
  }
};

const baseSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v3.json",
  mark: {
    type: "bar",
    cursor: "pointer"
  },
  encoding: {
    color: {
      field: "dimmed",
      type: "nominal",
      scale: {
        // First color is default bar color. Second color for unselected bars.
        range: ["#707986", "#cccfd4"]
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
  }
};

const facetValueCountAxis = {
  field: "count",
  type: "quantitative",
  title: "",
  stack: null,
  axis: {
    labelColor: "#000000de",
    labelFont: "Montserrat",
    labelFontSize: 11
  },
  scale: {
    rangeStep: 20
  }
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
        labelColor: "#000000de",
        labelFont: "Montserrat",
        labelFontSize: 11,
        labelLimit: 120
      },
      scale: {
        paddingInner: 0.02,
        rangeStep: 20
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
        {this.props.facet.values && this.props.facet.values.length > 0 && (
          <div className={classes.vega}>
            <VegaLite
              spec={spec}
              data={data}
              tooltip={new Handler().call}
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
