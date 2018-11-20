import React, { Component } from "react";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";

import "components/facets/FacetsGrid.css";
import FacetCard from "components/facets/FacetCard";

function FacetsGrid(props) {
  // An array of es field names
  const facets = props.facets;
  const updateFacets = props.updateFacets;
  const facetsList = facets.map(facet => (
    <GridListTile key={facet.name}>
      <FacetCard
        facet={facet}
        selectedValues={getSelectedFacets(
          props.selectedFacetValues,
          facet.es_field_name
        )}
        updateFacets={updateFacets}
      />
    </GridListTile>
  ));
  return (
    <GridList className="gridList" cols={3} cellHeight="auto" padding={1}>
      {facetsList}
    </GridList>
  );
}

// Returns the list of selected facet values for a particular facet.
function getSelectedFacets(selectedFacetValues, es_field_name) {
  let selectedValuesArray = Array.from(selectedFacetValues.entries());
  for (let i = 0; i < selectedValuesArray.length; i++) {
    if (selectedValuesArray[i][0] == es_field_name) {
      return selectedValuesArray[i][1];
    }
  }
  return [];
}

export default FacetsGrid;
