import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

class ExportForm extends React.Component {
  render() {
    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Export to Saturn</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="workspace-namespace"
            label="Workspace Namespace"
            fullWidth
          />
          <TextField
            margin="dense"
            id="workspace-name"
            label="Workspace Name"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.handleClose} color="primary">
            Cancel
          </Button>
          <Button color="primary" disabled>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default ExportForm;
