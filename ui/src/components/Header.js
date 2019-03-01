import React from "react";
import AppBar from "@material-ui/core/AppBar";
import CloseIcon from "@material-ui/icons/Close";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import IconButton from "@material-ui/core/IconButton";
import InfoIcon from "@material-ui/icons/Info";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import Switch from "@material-ui/core/Switch";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

import { logoGlow } from "libs/icons";

const styles = {
  appBar: {
    backgroundColor: "#74ae43",
    borderBottom: "2px solid #b0d239",
    boxShadow: "rgba(0, 0, 0, 0.12) 0px 3px 2px 0px",
    height: 66
  },
  datasetName: {
    fontSize: 18,
    fontWeight: 600,
    marginRight: 100
  },
  logoGlow: {
    marginRight: 2
  },
  totalCount: {
    fontSize: 18,
    flexGrow: 1
  },
  snackbarMessage: {
    display: "grid",
    gridTemplateColumns: "30px auto"
  },
  snackbarInfoIcon: {
    gridRow: "1/3",
    gridColumn: "1",
    fontSize: "20px",
    marginRight: "12px",
    opacity: 0.9
  },
  snackbarContent: {
    alignItems: "baseline",
    backgroundColor: "#525c6c",
    borderRadius: "5px",
    fontSize: "12px",
    padding: "4px 16px 4px 16px"
  },
  snackbarCloseButton: {
    height: "24px",
    width: "24px"
  },
  snackbarCloseIcon: {
    fontSize: "20px",
    opacity: 0.9
  },
  toolbar: {
    paddingLeft: 0
  },
  vizSwitchBase: {
    "&$vizSwitchChecked": {
      color: "white",
      "& + $vizSwitchBar": {
        backgroundColor: "#b0d239"
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
    boxShadow: "0px 0px 8px 3px rgba(0,0,0,0.12)",
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
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    marginTop: -1
  }
};

class Header extends React.Component {
  state = {
    snackbarOpen: true
  };

  render() {
    const { classes } = this.props;

    const snackbarKey = "hasShownSnackbar";
    let snackbar = null;
    if (localStorage.getItem(snackbarKey) === null) {
      localStorage.setItem(snackbarKey, "true");
      snackbar = (
        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "center"
          }}
          open={this.state.snackbarOpen}
          autoHideDuration={6000}
          onClose={this.handleSnackbarClose}
        >
          <SnackbarContent
            className={classes.snackbarContent}
            message={
              <span className={classes.snackbarMessage}>
                <InfoIcon className={classes.snackbarInfoIcon} />
                <div>Click on a bar to select it</div>
                <div>
                  <i>Hint:&nbsp;</i> Clicking on whitespace also works
                </div>
              </span>
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
          <div className={classes.logoGlow}> {logoGlow} </div>
          <Typography
            className={classes.datasetName}
            variant="headline"
            color="inherit"
          >
            {this.props.datasetName}
          </Typography>
          <Typography className={classes.totalCount} color="inherit">
            {this.props.totalCount} Participants
          </Typography>
          <FormControlLabel
            classes={{ label: classes.vizSwitchLabel }}
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

export default withStyles(styles)(Header);
