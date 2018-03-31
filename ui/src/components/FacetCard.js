import './FacetCard.css';

import React, {Component} from 'react';
import {Card} from "material-ui/Card";
import {List, ListItem} from "material-ui/List";
import {Checkbox} from "material-ui";

class FacetCard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedValues: [],
            facetCount: this.sumFacetValueCounts(this.props.facet.values, []),
        };

        this.onValueCheck = this.onValueCheck.bind(this);
        this.isUnselected = this.isUnselected.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.totalCount !== this.props.totalCount) {
            this.setState({facetCount: this.sumFacetValueCounts(nextProps.facet.values, this.state.selectedValues)});
        }
    }

    render() {
        const facetValues = this.props.facet.values.map((facetValue) =>
            <ListItem
                className="listItem"
                key={facetValue.name}
                leftCheckbox={<Checkbox
                    onCheck={(event, isInputChecked) => this.onValueCheck(facetValue, isInputChecked)}
                />}
                primaryText={<div className={this.isUnselected(facetValue) ? " grayText" : ""}>
                    <div className="facetValueName">{facetValue.name}</div>
                    <div className="facetValueCount">{facetValue.count}</div>
                </div>}/>
        );
        return (
            <Card className="facetCard">
                <div className="cardHeader">
                    <div>{this.props.facet.name}</div>
                    <div className="subHeader">
                        <span>{this.state.facetCount}</span>
                        <span className="numberSelected">{this.state.selectedValues.length} / {facetValues.length}</span>
                    </div>
                </div>
                <List>{facetValues}</List>
            </Card>
        );
    }

    /** Update this card's state and trigger the callback on the parent component. */
    onValueCheck(facetValue, isInputChecked) {
        let newValues = this.state.selectedValues;
        if (isInputChecked) {
            newValues.push(facetValue.name);
        } else {
            newValues.splice(newValues.indexOf(facetValue.name), 1);
        }
        this.setState({selectedValues: newValues});
        this.props.updateFacets(this.props.facet.name, facetValue.name, isInputChecked);
    }

    isUnselected(facetValue) {
        if (this.state) {
            return this.state.selectedValues.length > 0 && this.state.selectedValues.indexOf(facetValue.name) < 0;
        }
        return false;
    }

    /**
     * @param facetValues FacetValue[] to sum counts over
     * @param selectedValueNames Optional string[] to select a subset of facetValues to sum counts for
     * @return count the total sum of all facetValue counts, optionally filtered by selectedValueNames
     * */
    sumFacetValueCounts(facetValues, selectedValueNames) {
        let count = 0;
        facetValues.forEach((value) => {
            if (selectedValueNames.length === 0 || selectedValueNames.indexOf(value.name) > -1) {
                count += value.count;
            }
        });
        return count;
    }
}

export default FacetCard;