/** Export to Saturn FAB */

import "./ExportFab.css";

import CloudUpload from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import React from "react";

function ExportFab(props) {
  return (
    <Button variant="fab" color="secondary" className="exportFab">
      <CloudUpload />
    </Button>
  );
}

export default ExportFab;
