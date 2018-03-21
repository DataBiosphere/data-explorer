import './FacetsGrid.css';

import React from 'react';
import FacetCard from "./FacetCard";
import {GridList, GridTile} from "material-ui/GridList";

function FacetsGrid(props) {
    const facetsResponse = props.facetsResponse;
    const facetsList = facetsResponse.facets.map((facet) =>
        <GridTile key={facet.name}>
            <FacetCard facet={facet} count={facetsResponse.count} className='facetCard'/>
        </GridTile>
    );
    return (
        <GridList
            className="gridList"
            cols={4}
            cellHeight="auto"
            padding={1}
        >
            {facetsList}
        </GridList>
    );
}

export default FacetsGrid;