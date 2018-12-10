import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import * as Style from "libs/style";

import FacetListView from "components/facets/FacetListView";
import FacetHistogram from "components/facets/FacetHistogram";

function FacetCard(props) {
  const { classes } = props
  const rand = Math.random() < 0.5
  const showVisualizations = props.showVisualizations

  const histogram = (
    <FacetHistogram
        facet={props.facet}
    />
  )
  const listView = (
    <FacetListView
      facet={props.facet}
      updateFacets={props.updateFacets}
      selectedValues={props.selectedValues}
    />
  )

  return showVisualizations ? histogram : listView;
}

export default FacetCard;
