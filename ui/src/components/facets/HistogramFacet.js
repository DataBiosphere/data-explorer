import React, { Component } from "react";
import VegaLite from "react-vega-lite";
import { Handler } from "vega-tooltip";

const styles = {};

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
      legend: null,
    },
    tooltip: [
      {
        title: "Facet Value",
        field: "facet_value",
        type: "nominal",
      },
      {
        title: "Count",
        field: "count",
        type: "quantitative",
      }
    ],
    x: {},
    y: {}
  }
}

function isRange(name) {
  const match = name.match(/[\d\.]*-[\d\.]*/g);
  return match != null && match.length > 0;
}

class FacetHistogram extends Component {
  constructor(props) {
    super(props);
    this.facetValues = this.props.facet.values;
    this.isDimmed = this.isDimmed.bind(this);
  }

  render() {
    // Loop over all facet values and create a data and sortOrder arrays.
    // Also determine if this is a numeric/range type facet.
    const data = {values: []}
    const sortOrder = []
    let rangeFacet = true
    for (var i in this.facetValues) {
      data.values.push({
        facet_value: this.facetValues[i].name,
        count: this.facetValues[i].count,
        dimmed: this.isDimmed(this.facetValues[i])
      })
      sortOrder.push(this.facetValues[i].name)
      rangeFacet = rangeFacet && isRange(this.facetValues[i].name)
    }

    const spec = Object.assign({}, baseSpec);
    // Range facets are shown as vertical histograms, while categorical
    // ones are horizontal in order to allow for more space for text.
    if (rangeFacet) {
      spec.encoding.x = {
        field: "facet_value",
        type: "nominal",
        title: this.props.facet.name,
        sort: sortOrder,
      }
      spec.encoding.y = {
        field: "count",
        type: "quantitative",
        title: "",
      }
    } else {
      spec.encoding.x = {
        field: "count",
        type: "quantitative",
        title: "",
      }
      spec.encoding.y = {
        field: "facet_value",
        type: "nominal",
        title: this.props.facet.name,
        sort: sortOrder,
      }
    }

    return (
      <VegaLite
        spec={spec}
        data={data}
        tooltip={new Handler().call}
      />
    );
  }

  isDimmed(facetValue) {
    return (
      this.props.selectedValues != null &&
      this.props.selectedValues.length > 0 &&
      !this.props.selectedValues.includes(facetValue.name)
    );
  }
}

export default FacetHistogram;
