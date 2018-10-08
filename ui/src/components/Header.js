import React from "react";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";

import "components/Header.css";

function Header(props) {
  const datasetName = props.datasetName;
  const totalCount = props.totalCount;

  return (
    <Toolbar className="toolbar">
      <ToolbarGroup firstChild={true}>
        <ToolbarTitle className="datasetName" text={datasetName} />
      </ToolbarGroup>
      <ToolbarGroup>
        <div className="participantCountBox">
          <div className="totalCountText">{totalCount}</div>
          <div>Participants</div>
        </div>
      </ToolbarGroup>
    </Toolbar>
  );
}

export default Header;
