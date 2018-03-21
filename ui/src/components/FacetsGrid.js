import './FacetsGrid.css';

import React from 'react';
import FacetCard from "./FacetCard";
import {GridList, GridTile} from "material-ui/GridList";

function FacetsGrid(props) {
    const facetResponse = props.facetResponse;
    const facetsList = facetResponse.facets.map((facet) =>
        <GridTile key={facet.name}>
            <FacetCard facet={facet} count={facetResponse.count} className='facetCard'/>
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