import './FacetCard.css';

import React from 'react';
import {Card} from "material-ui/Card";
import {List, ListItem} from "material-ui/List";
import {Checkbox} from "material-ui";

function FacetCard(props) {
    const facet = props.facet;
    const totalCount = props.count;
    const facetValues = facet.values.map((facetValue) =>
        <ListItem
            className="listItem"
            key={facetValue.name}
            leftCheckbox={<Checkbox />}
            primaryText={<div>
                <div className="facetValueName">{facetValue.name}</div>
                <div className="facetValueCount">{facetValue.count}</div>
            </div>}/>
    );
    return (
        <Card className="facetCard">
            <div className="cardHeader">
                <div>{facet.name}</div>
                <div className="subHeader">
                    <span>{totalCount}</span>
                    <span className="numberSelected">0 / {facetValues.length}</span>
                </div>
            </div>
            <List>{facetValues}</List>
        </Card>
    );
}

export default FacetCard;