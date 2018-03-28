import './FacetsGrid.css';
import FacetCard from "./FacetCard";

import React, { Component } from 'react';
import {GridList, GridTile} from "material-ui/GridList";

function FacetsGrid(props) {
    const facets = props.facets;
    const totalCount = props.totalCount;
    const updateFacets = props.updateFacets;
    const facetsList = facets.map((facet) =>
        <GridTile key={facet.name}>
            <FacetCard
                facet={facet}
                count={totalCount}
                updateFacets={updateFacets}
                className='facetCard'/>
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
