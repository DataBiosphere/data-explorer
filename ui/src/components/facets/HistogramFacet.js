import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

import "./HistogramFacet.css";
import * as Style from "libs/style";
import FacetHeader from "components/facets/FacetHeader";
import Histogram from "components/facets/Histogram";

const styles = {
  histogramFacet: {
    ...Style.elements.card,
    margin: "0 25px 28px 0",
    maxHeight: "500px",
    overflowY: "auto",
    padding: 0
  }
};

// Booleans get rendered as lowercase 'true' or 'false'
// Render them as uppercase 'True' or 'False'
function true_or_false_to_uppercase(value_name) {
  return (value_name === "true" ? "True" :
          value_name === "false" ? "False":
          value_name);
}

class HistogramFacet extends Component {
  render() {
    const { classes } = this.props;

    let values = [];
    for (let i = 0; i < this.props.facet.value_names.length; i++) {
      values.push({
        name: true_or_false_to_uppercase(this.props.facet.value_names[i]),
        count: this.props.facet.value_counts[i]
      });
    }

    return (
      <div className={classes.histogramFacet}>
        <FacetHeader
          facet={this.props.facet}
          values={values}
          selectedValues={this.props.selectedValues}
          handleRemoveFacet={this.props.handleRemoveFacet}
          isExtraFacet={this.props.isExtraFacet}
          isTimeSeries={false}
        />
        {this.props.facet.value_counts &&
          this.props.facet.value_counts.length > 0 && (
            <Histogram
              es_field_name={this.props.facet.es_field_name}
              es_field_type={this.props.facet.es_field_type}
              values={values}
              selectedValues={this.props.selectedValues}
              updateFacets={this.props.updateFacets}
            />
          )}
      </div>
    );
  }
}

export default withStyles(styles)(HistogramFacet);
