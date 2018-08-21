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
        {/*
          Style div instead of button itself, to prevent button from moving
          when cohort dialog is shown. See
          https://github.com/mui-org/material-ui/issues/9275#issuecomment-350479467
        */}
        <div className="mui-fixed exportFab">
          <Tooltip title="Export to Saturn">
            <Button
              variant="fab"
              color="secondary"
              onClick={() => this.handleClick()}
            >
              <CloudUpload />
            </Button>
          </Tooltip>
        </div>
        <div>
          <Dialog
            open={this.state.open}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Cohort Name"
                helperText="A cohort with this name will be created in Saturn"
                type="text"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCancel} color="primary">
                Cancel
              </Button>
              <Button onClick={this.handleSave} color="primary">
                Export
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }

  handleClick() {
    var filter = this.props.filter;
    if (filter != null && filter.length > 0) {
      this.setState(state => ({ open: true }));
    } else {
      this.handleSave();
    }
  }

  handleCancel() {
    this.setState(state => ({ open: false }));
  }

  handleSave() {
    this.setState(state => ({ open: false }));
    let exportUrlCallback = function(error, data) {
      if (error) {
        alert(error.response.body.detail);
      } else {
        window.location.assign(
          "https://bvdp-saturn-prod.appspot.com/#import-data?format=entitiesJson&url=" +
            data.url
        );
      }
    }.bind(this);
    this.props.exportUrlApi.exportUrlPost(exportUrlCallback);
  }
}

export default ExportFab;
