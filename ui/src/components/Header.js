import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

function Header(props) {
  const datasetName = props.datasetName;
  const totalCount = props.totalCount;

  return (
    <AppBar position="static" style={{ backgroundColor: "#5aa6da" }}>
      <Toolbar>
        <Typography className="datasetName" variant="headline" color="inherit" style={{ flexGrow: 1 }}>
          {datasetName}
        </Typography>
        <Typography className="totalCountText" color="inherit">
          {totalCount} Participants
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
