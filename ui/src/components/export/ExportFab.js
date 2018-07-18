/** Export to Saturn FAB */

import "./ExportFab.css";

import React from "react";
import CloudUpload from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import ExportForm from "./ExportForm";

class ExportFab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false
    };
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleClickOpen() {
    this.setState({ dialogOpen: true });
  }

  handleClose() {
    this.setState({ dialogOpen: false });
  }

  render() {
    return (
      <div>
        <Button
          variant="fab"
          color="secondary"
          className="exportFab"
          onClick={this.handleClickOpen}
        >
          <CloudUpload />
        </Button>
        <ExportForm
          open={this.state.dialogOpen}
          handleClose={this.handleClose}
        />
      </div>
    );
  }
}

export default ExportFab;
