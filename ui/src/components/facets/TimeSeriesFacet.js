import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

import * as Style from "libs/style";
import FacetHeader from "components/facets/FacetHeader";
import TimeSeriesHistograms from "components/facets/TimeSeriesHistograms";

const styles = {
  timeSeriesFacet: {
    ...Style.elements.card,
    margin: "0 25px 28px 0",
    maxHeight: "500px",
    overflowX: "auto",
    overflowY: "auto",
    padding: 0
  }
};

class TimeSeriesFacet extends Component {
  render() {
    const { classes } = this.props;

    return (
      <div className={classes.timeSeriesFacet}>
        <FacetHeader
          facet={this.props.facet}
          selectedValues={this.props.selectedValues}
          handleRemoveFacet={this.props.handleRemoveFacet}
          isExtraFacet={this.props.isExtraFacet}
          isTimeSeries={true}
        />
        {this.props.facet.time_names &&
          this.props.facet.time_names.length > 0 && (
            <TimeSeriesHistograms
              facet={this.props.facet}
              updateFacets={this.props.updateFacets}
              handleRemoveFacet={this.props.handleRemoveFacet}
              isExtraFacet={this.props.isExtraFacet}
              selectedFacetValues={this.props.selectedFacetValues}
              timeSeriesUnit={this.props.timeSeriesUnit}
            />
          )}
      </div>
    );
  }
}

export default withStyles(styles)(TimeSeriesFacet);
