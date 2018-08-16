/** Export to Saturn FAB */

import "./ExportFab.css";

import CloudUpload from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";

class ExportFab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.handleClick = this.handleClick.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  render() {
    return (
      <div>
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
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogTitle id="form-dialog-title">Cohort Name</DialogTitle>
            <DialogContent>
              <DialogContentText>Enter the cohort name</DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Cohort Name"
                type="text"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleSave} color="primary">
                Export
              </Button>
              <Button onClick={this.handleCancel} color="primary">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }

  handleClick() {
    this.setState(state => ({ open: true }));
  }

  handleCancel() {
    this.setState(state => ({ open: false }));
  }

  handleSave() {
    let exportUrlCallback = function(error, data) {
      if (error) {
        console.error(error);
        // TODO(alanhwang): Redirect to an error page
      } else {
        window.location.assign(
          "https://bvdp-saturn-prod.appspot.com/#import-data?url=" + data.url
        );
      }
    }.bind(this);
    this.setState(state => ({ open: false }));
    this.props.exportUrlApi.exportUrlPost(exportUrlCallback);
  }
}

export default ExportFab;
