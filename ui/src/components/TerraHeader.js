import React from "react";
import AppBar from "@material-ui/core/AppBar";
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
    // background:
    //   `81px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat, ` +
    //   colors.success(),
    backgroundColor: colors.light(),
    borderBottom: "2px solid #73a7b0",
    boxShadow: "rgba(0, 0, 0, 0.12) 0px 1px 2px 0px",
    height: 66
  },
  dataExplorerText: {
    fontSize: 18,
    fontWeight: 600,
    marginRight: 15,
    color: "#045C6C"
  },
  datasetName: {
    fontSize: 18,
    fontWeight: 600,
    marginLeft: 15,
    color: "#045C6C"
  },
  toolbar: {
    padding: 0
  },
  verticalSeparator: {
    boxSizing: "border-box",
    height: 34,
    width: 2,
    border: "1px solid #97c543"
  }
};

class TerraHeader extends React.Component {
  render() {
    const { classes } = this.props;

    return (
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          <a href="https://app.terra.bio">
            <TerraLogo className={classes.terraLogo} />
          </a>
          <div className={classes.dataExplorerText}>Data Explorer</div>
          <div className={classes.verticalSeparator} />
          <div className={classes.datasetName}>{this.props.datasetName}</div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default withStyles(styles)(TerraHeader);
