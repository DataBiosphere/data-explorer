import './FacetsGrid.css';
import FacetCard from "./FacetCard";

import React, { Component } from 'react';
import {GridList, GridTile} from "material-ui/GridList";

function FacetsGrid(props) {
    const facets = props.facets;
    const updateFacets = props.updateFacets;
    const facetsList = facets.map((facet) =>
        <GridTile key={facet.name}>
            <FacetCard
                facet={facet}
                updateFacets={updateFacets}
            />
        </GridTile>
    );
    return (
        <GridList
            className="gridList"
            cols={3}
            cellHeight="auto"
            padding={1}
        >
            {facetsList}
        </GridList>
    );
}

export default FacetsGrid;
