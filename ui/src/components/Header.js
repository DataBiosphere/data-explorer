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
import headerLeftHexes from "libs/images/header-left-hexes.svg";
import headerRightHexes from "libs/images/header-right-hexes.svg";
import { TerraLogoStyles } from "libs/icons";
import { ReactComponent as TerraLogo } from "libs/icons/logo-wShadow.svg";

const styles = {
  ...TerraLogoStyles,
  appBar: {
    background: `81px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat, ${
      colors.green[1]
    }`,
    borderBottom: "2px solid #b0d239",
    boxShadow: "rgba(0, 0, 0, 0.12) 0px 3px 2px 0px",
    height: 66
  },
  dataExplorerText: {
    fontSize: 18,
    fontWeight: 600,
    marginRight: 15
  },
  datasetName: {
    fontSize: 18,
    fontWeight: 600,
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
    backgroundColor: "#b0d239",
    borderRadius: 15.5,
    fontSize: 16,
    fontWeight: 500,
    height: 31,
    lineHeight: 2,
    marginLeft: 40,
    padding: "0 20px 0 20px"
  },
  verticalSeparator: {
    boxSizing: "border-box",
    height: 34,
    width: 2,
    border: "1px solid #97c543"
  }
};

function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}

class Header extends React.Component {
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
          <TerraLogo className={classes.terraLogo} />
          <div className={classes.dataExplorerText}>Data Explorer</div>
          <div className={classes.verticalSeparator} />
          <div className={classes.datasetName}>{this.props.datasetName}</div>
          <div className={classes.totalCount}>
            {this.props.totalCount} Participants
          </div>
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

export default withStyles(styles)(Header);
