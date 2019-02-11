import React, { Component } from "react";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import { withStyles } from "@material-ui/core/styles";

import TextFacet from "components/facets/TextFacet";
import HistogramFacet from "components/facets/HistogramFacet";

const styles = {
  root: {
    padding: "20px"
  }
};

function facetCard(props, facet) {
  if (props.facetType == "viz") {
    return (
      <HistogramFacet
        facet={facet}
        updateFacets={props.updateFacets}
        selectedValues={props.selectedFacetValues.get(facet.es_field_name)}
      />
    );
  } else {
    return (
      <TextFacet
        facet={facet}
        updateFacets={props.updateFacets}
        selectedValues={props.selectedFacetValues.get(facet.es_field_name)}
      />
    );
  }
}

function FacetsGrid(props) {
  const { classes } = props;

  const facetsList = props.facets.map(facet => {
    return (
      <GridListTile key={facet.name}>{facetCard(props, facet)}</GridListTile>
    );
  });
  return (
    <div className={classes.root}>
      <GridList className={classes.gridList} cols={3} cellHeight="auto">
        {facetsList}
      </GridList>
    </div>
  );
}

export default withStyles(styles)(FacetsGrid);
