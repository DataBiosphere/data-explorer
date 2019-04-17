import React from "react";
import AppBar from "@material-ui/core/AppBar";
import CloseIcon from "@material-ui/icons/Close";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import IconButton from "@material-ui/core/IconButton";
import Slide from "@material-ui/core/Slide";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Switch from "@material-ui/core/Switch";
import Toolbar from "@material-ui/core/Toolbar";
import { withStyles } from "@material-ui/core/styles";

import { buttonPrimary } from "libs/common";
import colors from "libs/colors";
import Search from "components/Search";

const styles = {
  appBar: {
    backgroundColor: colors.grayBlue[6],
    boxShadow: "unset",
    color: colors.gray[0],
    marginTop: 16
  },
  datasetName: {
    fontSize: 28,
    marginLeft: 15
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
    backgroundColor: colors.lightGreen[4],
    borderRadius: 15.5,
    color: "#7f8fa4",
    fontSize: 16,
    fontWeight: 500,
    height: 31,
    lineHeight: 2,
    marginLeft: 40,
    padding: "0 20px 0 20px"
  },
  vizSwitchBase: {
    "&$vizSwitchChecked": {
      color: "white",
      "& + $vizSwitchBar": {
        backgroundColor: colors.lightGreen[2]
      }
    }
  },
  vizSwitchChecked: {
    transform: "translateX(15px)",
    "& + $vizSwitchBar": {
      opacity: 1,
      border: "none"
    }
  },
  vizSwitchBar: {
    borderRadius: 13,
    width: 36,
    height: 20,
    marginTop: -10,
    marginLeft: -17,
    backgroundColor: "#cccfd4",
    opacity: 1
  },
  vizSwitchIcon: {
    width: 16,
    height: 16
  },
  vizSwitchLabel: {
    color: "#7f8fa4",
    fontSize: 12,
    fontWeight: 600,
    marginTop: -1
  },
  vizSwitchRoot: {
    margin: "2px 32px 0 auto"
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

    const saveButton = buttonPrimary({}, ["Primary Button"]);

    return (
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          {snackbar}
          <div className={classes.datasetName}>{this.props.datasetName}</div>
          <div className={classes.totalCount}>
            {this.props.totalCount} Participants
          </div>
          {saveButton}
        </Toolbar>
        <Toolbar className={classes.toolbar}>
          <Search
            searchPlaceholderText={this.props.searchPlaceholderText}
            defaultOptions={this.props.searchResults}
            handleSearchBoxChange={this.props.handleSearchBoxChange}
            selectedFacetValues={this.props.selectedFacetValues}
            facets={this.props.facets}
            loadOptions={this.props.handleSearchBoxTyping}
          />
          <FormControlLabel
            classes={{
              label: classes.vizSwitchLabel,
              root: classes.vizSwitchRoot
            }}
            control={
              <Switch
                classes={{
                  switchBase: classes.vizSwitchBase,
                  bar: classes.vizSwitchBar,
                  icon: classes.vizSwitchIcon,
                  checked: classes.vizSwitchChecked
                }}
                checked={this.props.showViz}
                onChange={this.props.handleVizSwitchChange}
              />
            }
            label="Visualizations"
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
