/** Export to Saturn FAB */

import "./ExportFab.css";

import FileCloudUpload from "material-ui/svg-icons/file/cloud-upload";
import { FloatingActionButton } from "material-ui";
import React from "react";
import { white } from "material-ui/styles/colors";

function ExportFab(props) {
  return (
    <FloatingActionButton className="exportFab">
      <FileCloudUpload color={white} />
    </FloatingActionButton>
  );
}

export default ExportFab;
