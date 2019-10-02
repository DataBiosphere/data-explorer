import React from "react";
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
    const { classes } = this.props;

    const howToUseSnackbar = (
      <Snackbar
        message={
          <>
            <div>
              <b>{Date.now()}How to use Data Explorer</b>
            </div>
            <br />
            <div>Click on a bar to select it</div>
            <div>
              <i>Hint:&nbsp;</i> Clicking on whitespace also works
            </div>
          </>
        }
      />
    );

    return (
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          {howToUseSnackbar}
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
