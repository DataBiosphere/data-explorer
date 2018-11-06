import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import * as Style from "libs/style";
import "components/facets/FacetCard.css";

const styles = {
  facetValueList: {
    gridColumn: '1 / 3',
    margin: '20px 0 0 0',
    maxHeight: '600px',
    overflow: 'auto',
  },
  facetValue: {
    // This is a nested div, so need to specify a new grid.
    display: 'grid',
    gridTemplateColumns: '50px auto 50px',
    justifyContent: 'stretch',
    padding: '0',
    // Disable gray background on ListItem hover.
    '&:hover': {
      backgroundColor: 'unset',
    },
  },
}

class FacetCard extends Component {
  constructor(props) {
    super(props);

    this.facetValues = this.props.facet.values;

    this.state = {
      // List of strings, eg ["female"]
      selectedValues: []
    };

    this.totalFacetValueCount = this.sumFacetValueCounts(
      this.props.facet.values,
      []
    );

    this.onClick = this.onClick.bind(this);
    this.isDimmed = this.isDimmed.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.totalFacetValueCount = this.sumFacetValueCounts(
      nextProps.facet.values,
      this.state.selectedValues
    );
  }

  render() {
    const { classes } = this.props;

    // facetValue is a dict, eg { name: "female", count: 1760 }
    const facetValues = this.props.facet.values.map(facetValue => (
      <ListItem
        className={classes.facetValue}
        key={facetValue.name}
        button
        dense
        disableRipple
        onClick={e => this.onClick(facetValue.name)}
      >
        <Checkbox
          style={{ width: "24px", height: "24px" }}
          checked={this.state.selectedValues.includes(facetValue.name)}
        />
        <ListItemText
          primary={
            <div className={this.isDimmed(facetValue) ? " grayText" : ""}>
              <div className="facetValueName">{facetValue.name}</div>
              <div className="facetValueCount">{facetValue.count}</div>
            </div>
          }
        />
      </ListItem>
    ));
    const totalFacetValueCount = (
      <span className="totalFacetValueCount">{this.totalFacetValueCount}</span>
    );
    return (
      <div className="facetCard" style={Style.elements.card}>
        <div>
          <span>{this.props.facet.name}</span>
          {this.props.facet.name != "Samples Overview"
            ? totalFacetValueCount
            : null}
        </div>
        <span className="facetDescription">{this.props.facet.description}</span>
        <List dense className={classes.facetValueList} >{facetValues}</List>
      </div>
    );
  }

  isDimmed(facetValue) {
    return (
      this.state.selectedValues.length > 0 &&
      !this.state.selectedValues.includes(facetValue.name)
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

  onClick(facetValue) {
    // facetValue is a string, eg "female"
    let newValues = this.state.selectedValues.slice(0);
    let isSelected;
    if (this.state.selectedValues.includes(facetValue)) {
      // User must have unchecked the checkbox.
      isSelected = false;
      newValues.splice(newValues.indexOf(facetValue), 1);
    } else {
      // User must have checked the checkbox.
      isSelected = true;
      newValues.push(facetValue);
    }

    this.setState({ selectedValues: newValues });
    this.props.updateFacets(
      this.props.facet.es_field_name,
      facetValue,
      isSelected
    );
  }
}

export default withStyles(styles)(FacetCard);
