import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";

const styles = {
  facetDescription: {
    gridColumn: "1/3",
    color: colors.gray[1],
    fontSize: 14,
    fontWeight: 500,
    marginTop: "-7px",
    padding: "0px 18px 12px 14px"
  },
  facetHeader: {
    backgroundColor: colors.grayBlue[5],
    display: "grid",
    gridTemplateColumns: "auto 90px"
  },
  facetName: {
    color: colors.gray[1],
    fontSize: 16,
    fontWeight: 600,
    padding: "11px 0 12px 14px"
  },
  totalFacetValueCount: {
    color: colors.gray[1],
    fontSize: 16,
    fontWeight: 600,
    padding: "11px 18px 0 0",
    textAlign: "right"
  },
  removeFacet: {
    color: colors.gray[1],
    padding: "7px 0 0 50px"
  }
};

class FacetHeader extends Component {
  state = {
    hoveredOver: false
  };

  constructor(props) {
    super(props);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  render() {
    const { classes } = this.props;

    return (
      <div
        className={classes.facetHeader}
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
      >
        <div className={classes.facetName}>{this.props.facet.name}</div>
        {this.props.facetIsExtra && this.state.hoveredOver ? (
          <div className={classes.removeFacet} onClick={this.onClose}>
            <clr-icon shape="times" size="25" />
          </div>
        ) : (
          this.props.facet.name != "Samples Overview" && (
            <div className={classes.totalFacetValueCount}>
              {this.sumFacetValueCounts(
                this.props.facet.values,
                this.props.selectedValues
              )}
            </div>
          )
        )}
        {this.props.facet.description && (
          <div className={classes.facetDescription}>
            {this.props.facet.description}
          </div>
        )}
      </div>
    );
  }

  onClose() {
    this.props.removeFacet(this.props.facet.es_field_name);
  }

  mouseEnter() {
    this.setState({ hoveredOver: true });
  }

  mouseLeave() {
    this.setState({ hoveredOver: false });
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
