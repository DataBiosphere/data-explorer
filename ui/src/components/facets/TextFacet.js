import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import * as Style from "libs/style";
import FacetHeader from "components/facets/FacetHeader";

const styles = {
  textFacet: {
    ...Style.elements.card,
    margin: "0 25px 28px 0",
    // If there is a long word (eg facet name or facet value), break in the
    // middle of the word. Without this, the word stays on one line and its CSS
    // grid is wider than the facet card.
    wordBreak: "break-word"
  },
  facetValueList: {
    maxHeight: "400px",
    overflow: "auto"
  },
  facetValue: {
    justifyContent: "stretch",
    padding: "0",
    // Disable gray background on ListItem hover.
    "&:hover": {
      backgroundColor: "unset"
    }
  },
  facetValueCheckbox: {
    height: "24px",
    width: "24px"
  },
  facetValueNameAndCount: {
    display: "grid",
    gridTemplateColumns: "auto 50px",
    paddingRight: 0
  },
  facetValueName: {
    // Used by end-to-end tests
  },
  facetValueCount: {
    textAlign: "right"
  },
  listItemText: {
    paddingRight: 0
  },
  grayText: {
    color: "silver"
  }
};

class TextFacet extends Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.isValueDimmed = this.isValueDimmed.bind(this);
  }

  /*
          classes={{
            primary: this.isValueDimmed(value) ? classes.grayText : null
          }}
*/
  render() {
    const { classes } = this.props;

    const facetValueDivs = this.props.facet.values.map(value => (
      <ListItem
        className={classes.facetValue}
        key={value.name}
        button
        dense
        disableRipple
        onClick={e => this.onClick(value.name)}
      >
        <Checkbox
          className={classes.facetValueCheckbox}
          checked={
            this.props.selectedValues != null &&
            this.props.selectedValues.includes(value.name)
          }
        />
        <ListItemText
          classes={{
            primary: this.isValueDimmed(value)
              ? classes.facetValueNameAndCount + " " + classes.grayText
              : classes.facetValueNameAndCount,
            root: classes.listItemText
          }}
          primary={
            <>
              <div className={classes.facetValueName}>{value.name}</div>
              <div className={classes.facetValueCount}>{value.count}</div>
            </>
          }
        />
      </ListItem>
    ));

    return (
      <div className={classes.textFacet}>
        <FacetHeader
          facet={this.props.facet}
          selectedValues={this.props.selectedValues}
        />
        <List dense className={classes.facetValueList}>
          {facetValueDivs}
        </List>
      </div>
    );
  }

  isValueDimmed(facetValue) {
    return (
      this.props.selectedValues != null &&
      this.props.selectedValues.length > 0 &&
      !this.props.selectedValues.includes(facetValue.name)
    );
  }

  onClick(facetValue) {
    // facetValue is a string, eg "female"
    let isSelected;
    if (
      this.props.selectedValues != null &&
      this.props.selectedValues.length > 0 &&
      this.props.selectedValues.includes(facetValue)
    ) {
      // User must have unchecked the checkbox.
      isSelected = false;
    } else {
      // User must have checked the checkbox.
      isSelected = true;
    }

    this.props.updateFacets(
      this.props.facet.es_field_name,
      facetValue,
      isSelected
    );
  }
}

export default withStyles(styles)(TextFacet);
