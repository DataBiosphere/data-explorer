import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";

const styles = {
  facetDescription: {
    gridColumn: "1/3",
    color: colors.gray[1],
    fontSize: 14,
    marginBottom: 20
  },
  facetHeader: {
    display: "grid",
    gridTemplateColumns: "auto 50px"
  },
  facetName: {
    color: colors.gray[1],
    fontSize: 16,
    fontWeight: 600
  },
  totalFacetValueCount: {
    color: colors.gray[1],
    textAlign: "right"
  }
};

class FacetHeader extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.facetHeader}>
        <div className={classes.facetName}>{this.props.facet.name}</div>
        {this.props.facet.name != "Samples Overview" ? (
          <div className={classes.totalFacetValueCount}>
            {this.sumFacetValueCounts(
              this.props.facet.values,
              this.props.selectedValues
            )}
          </div>
        ) : (
          <div />
        )}
        <div className={classes.facetDescription}>
          {this.props.facet.description}
        </div>
      </div>
    );
  }

  /**
   * @param facetValues FacetValue[] to sum counts over
   * @param selectedValueNames Optional string[] to select a subset of facetValues to sum counts for
   * @return number count the total sum of all facetValue counts, optionally filtered by selectedValueNames
   */
  sumFacetValueCounts(facetValues, selectedValueNames) {
    let count = 0;
    if (selectedValueNames == null || selectedValueNames.length === 0) {
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
}

export default withStyles(styles)(FacetHeader);
