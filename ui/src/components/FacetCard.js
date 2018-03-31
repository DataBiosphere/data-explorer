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
            facetCount: this.sumCounts(this.props.facet.values),
        };

        this.onValueCheck = this.onValueCheck.bind(this);
        this.isUnselected = this.isUnselected.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.totalCount !== this.props.totalCount) {
            this.setState({facetCount: this.sumCounts(nextProps.facet.values)});
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

    sumCounts(facetValues) {
        let count = 0;
        facetValues.forEach((value) => {
            if (!this.isUnselected(value)) {
                count += value.count
            }
        });
        return count;
    }
}

export default FacetCard;