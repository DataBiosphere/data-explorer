import React from "react";
import AppBar from "@material-ui/core/AppBar";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import Slide from "@material-ui/core/Slide";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Toolbar from "@material-ui/core/Toolbar";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import CopyUrlButton from "components/CopyUrlButton";
import SaveButton from "components/SaveButton";
import Search from "components/Search";

const styles = {
  appBar: {
    backgroundColor: colors.grayBlue[6],
    boxShadow: "unset",
    color: colors.gray[0],
    marginTop: 3
  },
  saveButton: {
    margin: "0 16px 0 16px"
  },
  snackbarContentMessage: {
    fontWeight: 500,
    padding: 0,
    width: 200
  },
  snackbarContentRoot: {
    alignItems: "baseline",
    backgroundColor: colors.gray[1],
    borderLeft: "5px solid " + colors.gray[0],
    borderRadius: 5,
    fontSize: 12,
    minWidth: 228,
    padding: "8px 16px 20px 17px"
  },
  snackbarCloseButton: {
    height: "24px",
    width: "24px",
    // Disble hover circle so we don't have to line it up with close icon
    "&:hover": {
      backgroundColor: "unset"
    }
  },
  snackbarCloseIcon: {
    fontSize: "20px",
    opacity: 0.9
  },
  snackbarRoot: {
    right: 10,
    top: 75
  },
  toolbar: {
    padding: 0
  },
  totalCount: {
    alignItems: "center",
    color: colors.gray[0],
    display: "flex",
    fontSize: 16,
    height: 45,
    lineHeight: "16px",
    marginLeft: 16,
    padding: "2px 16px 0 16px",
    textAlign: "center"
  }
};

function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}

class DeHeader extends React.Component {
  state = {
    snackbarOpen: true
  };

  render() {
    const { classes } = this.props;

    const snackbarKey = "hasShownSnackbarv2";
    let snackbar = null;
    if (localStorage.getItem(snackbarKey) === null) {
      localStorage.setItem(snackbarKey, "true");
      snackbar = (
        <Snackbar
          className={classes.snackbarRoot}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={this.state.snackbarOpen}
          onClose={this.handleSnackbarClose}
          TransitionComponent={TransitionLeft}
        >
          <SnackbarContent
            classes={{
              message: classes.snackbarContentMessage,
              root: classes.snackbarContentRoot
            }}
            message={
              <>
                <div>
                  <b>How to use Data Explorer</b>
                </div>
                <br />
                <div>Click on a bar to select it</div>
                <div>
                  <i>Hint:&nbsp;</i> Clicking on whitespace also works
                </div>
              </>
            }
            action={[
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                onClick={this.handleSnackbarClose}
                className={classes.snackbarCloseButton}
              >
                <CloseIcon className={classes.snackbarCloseIcon} />
              </IconButton>
            ]}
          />
        </Snackbar>
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
          />
          <div className={classes.totalCount}>
            {this.props.totalCount} Participants
          </div>
          <CopyUrlButton />
          <SaveButton
            className={classes.saveButton}
            exportUrlApi={this.props.exportUrlApi}
            selectedFacetValues={this.props.selectedFacetValues}
          />
        </Toolbar>
      </AppBar>
    );
  }

  handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ snackbarOpen: false });
  };
}

export default withStyles(styles)(DeHeader);
