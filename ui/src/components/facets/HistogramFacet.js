import React, { Component } from "react";
import VegaLite from "react-vega-lite";
import { Handler } from "vega-tooltip";

const baseSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v3.json",
  mark: "bar",
  width: 400,
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
    y: {}
  }
};

const count_axis = {
  field: "count",
  type: "quantitative",
  title: ""
};

function isCategorical(facet) {
  return (
    facet.es_field_type == "text" || facet.es_field_type == "samples_overview"
  );
}

class FacetHistogram extends Component {
  constructor(props) {
    super(props);
    this.isValueDimmed = this.isValueDimmed.bind(this);
    this.onNewView = this.onNewView.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  render() {
    const spec = Object.assign({}, baseSpec);
    // Categorical facets are shown as horizontal histograms,
    // in order to allow for more space for text.
    const value_axis = {
      field: "facet_value",
      type: "nominal",
      title: this.props.facet.name,
      sort: this.props.facet.values.map(v => v.name),
      axis: {
        labelAngle: 0,
        labelOverlap: true
      }
    };
    if (isCategorical(this.props.facet)) {
      spec.encoding.x = count_axis;
      spec.encoding.y = value_axis;
    } else {
      spec.encoding.x = value_axis;
      spec.encoding.y = count_axis;
    }

    const data = {
      values: this.props.facet.values.map(v => {
        return {
          facet_value: v.name,
          count: v.count,
          dimmed: this.isValueDimmed(v),
          text: `${v.name}: ${v.count}`
        };
      })
    };

    return (
      <VegaLite
        spec={spec}
        data={data}
        tooltip={new Handler().call}
        onNewView={this.onNewView}
      />
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

export default FacetHistogram;
