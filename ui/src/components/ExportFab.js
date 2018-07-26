/** Export to Saturn FAB */

import "./ExportFab.css";

import CloudUpload from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";

function ExportFab(props) {
  return (
    <Tooltip title="Export to Saturn">
      <Button variant="fab" color="secondary" className="exportFab"
           href="https://bvdp-saturn-prod.appspot.com/#import-data">
        <CloudUpload />
      </Button>
    </Tooltip>
  );
}

export default ExportFab;
