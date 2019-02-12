import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

const styles = {
  // Grid from TextFacet/HistogramFacet applies. (Grid is defined in TextFacet
  // instead of here, so facet value counts can be in same column as total facet
  // value count.)
  // By default, each div takes up one grid cell.
  // Don't specify gridColumn, just use default of one cell.
  facetDescription: {
    color: "gray",
    marginBottom: 20
  },
  totalFacetValueCount: {
    color: "gray",
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
      // Use React.Fragment instead of div. div messes up grid formatting:
      // Facet name would be grandchild of TextFacet rather than child.
      <React.Fragment>
        <Typography>{this.props.facet.name}</Typography>
        {this.props.facet.name != "Samples Overview" ? (
          <Typography className={classes.totalFacetValueCount}>
            {this.sumFacetValueCounts(
              this.props.facet.values,
              this.props.selectedValues
            )}
          </Typography>
        ) : (
          <div />
        )}
        <Typography className={classes.facetDescription}>
          {this.props.facet.description}
        </Typography>
      </React.Fragment>
    );
  }

  /**
   * @param facetValues FacetValue[] to sum counts over
   * @param selectedValueNames Optional string[] to select a subset of facetValues to sum counts for
   * @return number count the total sum of all facetValue counts, optionally filtered by selectedValueNames
   * */
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
