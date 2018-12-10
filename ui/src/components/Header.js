import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Switch from '@material-ui/core/Switch';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

function Header(props) {
  const datasetName = props.datasetName;
  const totalCount = props.totalCount;
  const enableVisualizations = props.enableVisualizations;
  const handleVisualizationChange = props.handleVisualizationChange;

  return (
    <AppBar position="static" style={{ backgroundColor: "#5aa6da" }}>
      <Toolbar>
        <Typography className="datasetName" variant="headline" color="inherit" style={{ flexGrow: 0.1 }}>
          {datasetName}
        </Typography>
        <Typography className="totalCountText" color="inherit" style={{ flexGrow: 1 }}>
          {totalCount} Participants
        </Typography>
        {enableVisualizations && (<Typography className="totalCountText" color="inherit">Visualizations</Typography>)}
        {enableVisualizations && (<Switch onChange={handleVisualizationChange}/>)}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
