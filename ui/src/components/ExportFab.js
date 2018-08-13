/** Export to Saturn FAB */

import "./ExportFab.css";

import CloudUpload from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";

class ExportFab extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    return (
      <Tooltip title="Export to Saturn">
        <Button
          variant="fab"
          color="secondary"
          className="exportFab"
          onClick={() => this.handleClick()}
        >
          <CloudUpload />
        </Button>
      </Tooltip>
    );
  }

  handleClick() {
    let exportUrlCallback = function(error, data) {
      if (error) {
        alert(error.response.body.detail);
      } else {
        window.location.assign(
          "https://bvdp-saturn-prod.appspot.com/#import-data?format=entitiesJson&url=" + data.url
        );
      }
    }.bind(this);
    this.props.exportUrlApi.exportUrlPost(exportUrlCallback);
  }
}

export default ExportFab;
