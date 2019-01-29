import React, { Component } from "react";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import { withStyles } from "@material-ui/core/styles";

import FacetCard from "components/facets/FacetCard";

const styles = {
  root: {
    margin: "20px"
  },
  gridList: {
    margin: "200px"
  }
};

function FacetsGrid(props) {
  const { classes } = props;

  const facetsList = props.facets.map(facet => (
    <GridListTile key={facet.name}>
      <FacetCard
        facet={facet}
        selectedValues={props.selectedFacetValues.get(facet.es_field_name)}
        updateFacets={props.updateFacets}
      />
    </GridListTile>
  ));
  return (
    <div className={classes.root}>
      <GridList className={classes.gridList} cols={3} cellHeight="auto">
        {facetsList}
      </GridList>
    </div>
  );
}

export default withStyles(styles)(FacetsGrid);
