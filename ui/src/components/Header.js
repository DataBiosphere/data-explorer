import React from "react";
import AppBar from "@material-ui/core/AppBar";
import InsertChartIcon from "@material-ui/icons/InsertChart";
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
    // Must be same color as header background to fix border-radius bleed
    // (https://stackoverflow.com/a/30356787/6447189)
    backgroundColor: "#55a146"
  },
  toggleButtonRoot: {
    backgroundColor: "#5c912e",
    "&$toggleButtonSelected": {
      color: "white",
      backgroundColor: "#c8dfb4"
    }
  },
  toggleButtonSelected: {}
};

function Header(props) {
  const { classes } = props;
  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Typography
          className={classes.datasetName}
          variant="headline"
          color="inherit"
        >
          {props.datasetName}
        </Typography>
        <Typography className={classes.totalCount} color="inherit">
          {props.totalCount} Participants
        </Typography>
        {props.showVizToggle && (
          <ToggleButtonGroup
            value={props.facetType}
            exclusive
            onChange={props.handleVizToggleChange}
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
            </ToggleButton>}
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
        )}
      </Toolbar>
    </AppBar>
  );
}

export default withStyles(styles)(Header);
