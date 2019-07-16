import React, { Component } from "react";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";

const styles = {
  extraFacetHeader: {
    "&:hover $totalFacetValueCount": {
      display: "none"
    },
    "&:hover $closeIcon": {
      display: "block"
    }
  },
  facetDescription: {
    gridColumn: "1/3",
    color: "#525c6c",
    fontSize: 14,
    fontWeight: 500,
    marginTop: "-7px",
    padding: "0px 18px 12px 14px"
  },
  facetHeader: {
    backgroundColor: "#f1f4f7",
    display: "grid",
    gridTemplateColumns: "auto 90px"
  },
  facetName: {
    color: "#525c6c",
    fontSize: 16,
    fontWeight: 600,
    padding: "11px 0 12px 14px"
  },
  totalFacetValueCount: {
    color: "#525c6c",
    fontSize: 16,
    fontWeight: 600,
    padding: "11px 18px 0 0",
    textAlign: "right"
  },
  closeIcon: {
    color: "#525c6c",
    display: "none",
    padding: "7px 0 0 50px"
  }
};

class FacetHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredOver: false
    };

    this.handleRemoveFacet = this.handleRemoveFacet.bind(this);
  }

  render() {
    const { classes } = this.props;

    return (
      <div
        className={
          this.props.isExtraFacet
            ? classNames(classes.facetHeader, classes.extraFacetHeader)
            : classes.facetHeader
        }
      >
        <div className={classes.facetName}>{this.props.facet.name}</div>
        {this.props.facet.name !== "Samples Overview" &&
          !this.props.isTimeSeries && (
            <div className={classes.totalFacetValueCount}>
              {this.sumFacetValueCounts(
                this.props.values,
                this.props.selectedValues
              )}
            </div>
          )}
        {this.props.isExtraFacet && (
          <div className={classes.closeIcon} onClick={this.handleRemoveFacet}>
            <clr-icon shape="times" style={styles.clearIcon} size="24" />
          </div>
        )}
        {this.props.facet.description && (
          <div className={classes.facetDescription}>
            {this.props.facet.description}
          </div>
        )}
      </div>
    );
  }

  handleRemoveFacet() {
    this.props.handleRemoveFacet(this.props.facet.es_field_name);
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
