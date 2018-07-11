import "./FacetCard.css";

import React, { Component } from "react";
import { Card } from "material-ui/Card";
import { List, ListItem } from "material-ui/List";
import { Checkbox } from "material-ui";

class FacetCard extends Component {
  constructor(props) {
    super(props);

    this.facetValues = this.props.facet.values;

    this.state = {
      selectedValues: []
    };

    this.totalFacetValueCount = this.sumFacetValueCounts(
      this.props.facet.values,
      []
    );

    this.onValueCheck = this.onValueCheck.bind(this);
    this.isDimmed = this.isDimmed.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.totalFacetValueCount = this.sumFacetValueCounts(
      nextProps.facet.values,
      this.state.selectedValues
    );
  }

  render() {
    const facetValues = this.props.facet.values.map(facetValue => (
      <ListItem
        key={facetValue.name}
        leftCheckbox={
          <Checkbox
            onCheck={(event, isInputChecked) =>
              this.onValueCheck(facetValue, isInputChecked)
            }
          />
        }
        primaryText={
          <div className={this.isDimmed(facetValue) ? " grayText" : ""}>
            <div className="facetValueName">{facetValue.name}</div>
            <div className="facetValueCount">{facetValue.count}</div>
          </div>
        }
      />
    ));
    return (
      <Card className="facetCard">
        <div className="cardHeader">
          <div>
            <span>{this.props.facet.name}</span>
            <span className="totalFacetValueCount">
              {this.totalFacetValueCount}
            </span>
          </div>
          <span className="facetDescription">
            {this.props.facet.description}
          </span>
        </div>
        <List>{facetValues}</List>
      </Card>
    );
  }

  isDimmed(facetValue) {
    return (
      this.state.selectedValues.length > 0 &&
      this.state.selectedValues.indexOf(facetValue.name) < 0
    );
  }

  /**
   * @param facetValues FacetValue[] to sum counts over
   * @param selectedValueNames Optional string[] to select a subset of facetValues to sum counts for
   * @return number count the total sum of all facetValue counts, optionally filtered by selectedValueNames
   * */
  sumFacetValueCounts(facetValues, selectedValueNames) {
    let count = 0;
    if (selectedValueNames.length === 0) {
      facetValues.forEach(value => {
        count += value.count;
      });
    } else {
      facetValues.forEach(value => {
        if (selectedValueNames.indexOf(value.name) > -1) {
          count += value.count;
        }
      });
    }

    return count;
  }

  /** Update this card's state and trigger the callback on the parent component. */
  onValueCheck(facetValue, isInputChecked) {
    let newValues = this.state.selectedValues;
    if (isInputChecked) {
      newValues.push(facetValue.name);
    } else {
      newValues.splice(newValues.indexOf(facetValue.name), 1);
    }
    this.setState({ selectedValues: newValues });
    this.props.updateFacets(
      this.props.facet.name,
      facetValue.name,
      isInputChecked
    );
  }
}

export default FacetCard;
