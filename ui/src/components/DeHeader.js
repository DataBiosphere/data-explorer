import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import SaveButton from "components/SaveButton";
import Search from "components/Search";
import Snackbar from "components/Snackbar";

const styles = {
  appBar: {
    backgroundColor: "#fafbfc",
    boxShadow: "unset",
    color: colors.dark(),
    marginTop: 3
  },
  saveButton: {
    margin: "0 16px 0 16px"
  },
  snackbarHeader: {
    display: "flex"
  },
  snackbarTitle: {
    fontWeight: "bold",
    marginTop: 2
  },
  snackbarWarningIcon: {
    height: 24,
    marginRight: 16,
    width: 24
  },
  toolbar: {
    padding: 0
  },
  totalCount: {
    alignItems: "center",
    color: colors.dark(),
    display: "flex",
    fontSize: 16,
    height: 45,
    lineHeight: "16px",
    marginLeft: 16,
    padding: "2px 16px 0 16px",
    textAlign: "center"
  }
};

class DeHeader extends React.Component {
  render() {
    const { classes, invalidExtraFacets } = this.props;

    let snackbar = null;
    if (invalidExtraFacets && invalidExtraFacets.length) {
      // Render each facet on its own line
      const invalidExtraFacetsDivs = invalidExtraFacets.map(facet => (
        <div>{facet}</div>
      ));
      snackbar = (
        <Snackbar
          message={
            <>
              <div className={classes.snackbarHeader}>
                {/* Set style instead of className; otherwise, width is not overridden */}
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={styles.snackbarWarningIcon}
                />
                <div className={classes.snackbarTitle}>
                  {invalidExtraFacets.length == 1
                    ? "Unknown facet"
                    : "Unknown facets"}
                </div>
              </div>
              <br />
              <div>
                <i>{invalidExtraFacetsDivs}</i>
              </div>
              <br />
              <div>
                Try searching for
                {invalidExtraFacets.length == 1
                  ? " this facet "
                  : " these facets "}
                and saving cohort to Terra again.
              </div>
            </>
          }
          type="warning"
        />
      );
    }

    return (
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          {snackbar}
          <Search
            searchPlaceholderText={this.props.searchPlaceholderText}
            defaultOptions={this.props.searchResults}
            handleSearchBoxChange={this.props.handleSearchBoxChange}
            selectedFacetValues={this.props.selectedFacetValues}
            facets={this.props.facets}
            loadOptions={this.props.handleSearchBoxTyping}
            timeSeriesUnit={this.props.timeSeriesUnit}
          />
          <div className={classes.totalCount}>
            {this.props.totalCount} Participants
          </div>
          <SaveButton
            className={classes.saveButton}
            datasetName={this.props.datasetName}
            embed={this.props.embed}
            exportUrlApi={this.props.exportUrlApi}
            selectedFacetValues={this.props.selectedFacetValues}
          />
        </Toolbar>
      </AppBar>
    );
  }
}

export default withStyles(styles)(DeHeader);
