import "./FacetsGrid.css";
import FacetCard from "./FacetCard";

import React, { Component } from "react";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";

function FacetsGrid(props) {
  const facets = props.facets;
  const updateFacets = props.updateFacets;
  const facetsList = facets.map(facet => (
    <GridListTile key={facet.name}>
      <FacetCard facet={facet} updateFacets={updateFacets} />
    </GridListTile>
  ));
  return (
    <GridList className="gridList" cols={3} cellHeight="auto" padding={1}>
      {facetsList}
    </GridList>
  );
}

export default FacetsGrid;
