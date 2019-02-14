import React from "react";
import AppBar from "@material-ui/core/AppBar";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import InfoIcon from "@material-ui/icons/Info";
import InsertChartIcon from "@material-ui/icons/InsertChart";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import Toolbar from "@material-ui/core/Toolbar";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

const styles = {
  appBar: {
    background: "linear-gradient(180deg, #74ae43 0%, #359448 100%);"
  },
  datasetName: {
    marginRight: 100
  },
  totalCount: {
    fontSize: 17,
    // Make bottom of dataset name line up with bottom of total count
    paddingTop: "2.5px",
    flexGrow: 1
  },
  toggleButtonGroup: {
    borderRadius: "20px",
    // Must be same color as appBar background to fix border-radius bleed; see
    // https://stackoverflow.com/a/30356787/6447189i
    // appBar background is a gradient; use midpoint color
    backgroundColor: "#55a146"
  },
  toggleButtonRoot: {
    backgroundColor: "#5c912e",
    "&$toggleButtonSelected": {
      color: "white",
      backgroundColor: "#c8dfb4"
    }
  },
  toggleButtonSelected: {},
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
        <Toolbar>
          {snackbar}
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
          <ToggleButtonGroup
            value={this.props.facetType}
            exclusive
            onChange={this.props.handleVizToggleChange}
            className={classes.toggleButtonGroup}
          >
            <ToggleButton
              value="text"
              title="Show text"
              classes={{
                root: classes.toggleButtonRoot,
                selected: classes.toggleButtonSelected
              }}
            >
              <TextFieldsIcon />
            </ToggleButton>
            <ToggleButton
              value="viz"
              title="Show visualizations"
              classes={{
                root: classes.toggleButtonRoot,
                selected: classes.toggleButtonSelected
              }}
            >
              <InsertChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
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
