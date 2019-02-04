import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import * as Style from "libs/style";

import TextFacet from "components/facets/TextFacet";
import HistogramFacet from "components/facets/HistogramFacet";

function FacetCard(props) {
  const { classes } = props;
  const rand = Math.random() < 0.5;
  const facetType = props.facetType;

  const histogramFacet = (
    <HistogramFacet
      facet={props.facet}
      selectedValues={props.selectedValues}
    />
  );
  const textFacet = (
    <TextFacet
      facet={props.facet}
      updateFacets={props.updateFacets}
      selectedValues={props.selectedValues}
    />
  );

  return facetType == "viz" ? histogramFacet : textFacet;
}

export default FacetCard;
