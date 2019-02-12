import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import VegaLite from "react-vega-lite";
import { Handler } from "vega-tooltip";

import * as Style from "libs/style";

const styles = {
  histogramFacet: {
    ...Style.elements.card
  },
  facetName: {
    textAlign: "center"
  }
};

const baseSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v3.json",
  mark: "bar",
  width: 250,
  height: 300,
  encoding: {
    color: {
      field: "dimmed",
      type: "nominal",
      scale: {
        range: ["#4c78a8", "#aaafb7"]
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

const countAxis = {
  field: "count",
  type: "quantitative",
  title: "",
  stack: null,
  axis: {
    labelColor: "#000000de",
    labelFont: "Lato",
    labelFontSize: 11
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
    // Categorical facets are shown as horizontal histograms,
    // in order to allow for more space for text.
    const valueAxis = {
      field: "facet_value",
      type: "nominal",
      title: null,
      sort: this.props.facet.values.map(v => v.name),
      axis: {
        labelAngle: 0,
        labelOverlap: true,
        labelColor: "#000000de",
        labelFont: "Lato",
        labelFontSize: 11,
        labelLimit: 120
      }
    };
    if (isCategorical(this.props.facet)) {
      spec.encoding.x = countAxis;
      spec.encoding.y = valueAxis;
    } else {
      spec.encoding.x = valueAxis;
      spec.encoding.y = countAxis;
    }

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
        <Typography className={classes.facetName}>
          {this.props.facet.name}
        </Typography>
        <VegaLite spec={spec} data={data} tooltip={new Handler().call} />
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
