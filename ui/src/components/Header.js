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
    backgroundColor: "#5aa6da"
  },
  datasetName: {
    marginRight: 100
  },
  totalCount: {
    fontSize: 17,
    // Make bottom of dataset name line up with bottom of total count
    paddingTop: "2.5px",
    flexGrow: 1
  }
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
          >
            <ToggleButton value="text" title="Show text">
              <TextFieldsIcon />
            </ToggleButton>
            <ToggleButton value="viz" title="Show visualizations">
              <InsertChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default withStyles(styles)(Header);
