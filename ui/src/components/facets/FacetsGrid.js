import React from "react";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import { withStyles } from "@material-ui/core/styles";

import TextFacet from "components/facets/TextFacet";
import HistogramFacet from "components/facets/HistogramFacet";

const styles = {
  root: {
    // Needed to make left box shadow show up for all left-most tiles
    overflow: "unset"
  },
  tile: {
    // Needed to make left box shadow show up for all tiles
    overflow: "unset"
  }
};

function facetCard(props, facet) {
  if (props.showViz) {
    return (
      <HistogramFacet
        facet={facet}
        updateFacets={props.updateFacets}
        removeFacet={props.removeFacet}
        facetIsExtra={props.extraFacetEsFieldNames.includes(
          facet.es_field_name
        )}
        selectedValues={props.selectedFacetValues.get(facet.es_field_name)}
      />
    );
  } else {
    return (
      <TextFacet
        facet={facet}
        updateFacets={props.updateFacets}
        removeFacet={props.removeFacet}
        facetIsExtra={props.extraFacetEsFieldNames.includes(
          facet.es_field_name
        )}
        selectedValues={props.selectedFacetValues.get(facet.es_field_name)}
      />
    );
  }
}

function FacetsGrid(props) {
  const { classes } = props;

  const facetsList = props.facets.map(facet => {
    return (
      // Can't set padding the normal way because it's overridden by
      // GridListTile's built-in "style=padding:2".
      <GridListTile
        classes={{ tile: classes.tile }}
        key={facet.name}
        style={{ padding: 0 }}
      >
        {facetCard(props, facet)}
      </GridListTile>
    );
  });
  return (
    // Can't set margin the normal way because it's overridden by
    // GridList's built-in "style=margin:-2px".
    <GridList
      classes={{ root: classes.root }}
      cols={3}
      cellHeight="auto"
      style={{ margin: "23px -10px -5px 15px" }}
    >
      {facetsList}
    </GridList>
  );
}

export default withStyles(styles)(FacetsGrid);
