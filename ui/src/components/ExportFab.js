import React from "react";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles } from "@material-ui/core/styles";

import { ReactComponent as ExportButton } from "libs/icons/export_to_terra.svg";

const styles = {
  exportFab: {
    bottom: 45,
    position: "fixed",
    right: 35
  },
  exportButton: {
    filter: "drop-shadow( 0 2px 2px rgba(0,0,0,0.63))",
    height: 89,
    width: 81,
    "&:hover :first-child": {
      cursor: "pointer",
      fill: "#7cb24e"
    },
    "&:active :first-child": {
      fill: "#63953a"
    }
  }
};

class ExportFab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.handleClick = this.handleClick.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.setTextValue = this.setTextValue.bind(this);
  }

  render() {
    const { classes } = this.props;

    var filter = this.props.filter;
    var defaultTextValue =
      filter != null && filter.length > 0 ? "" : "all participants";
    return (
      <div>
        {/*
          Style div instead of button itself, to prevent button from moving to
          the right when cohort dialog is shown. See
          https://github.com/mui-org/material-ui/issues/9275#issuecomment-350479467
        */}
        <div className={"mui-fixed " + classes.exportFab}>
          <Tooltip title="Send to Terra">
            <ExportButton
              className={classes.exportButton}
              onClick={() => this.handleClick()}
            />
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
                defaultValue={defaultTextValue}
                fullWidth
                helperText="A cohort with this name will be created in Terra"
                id="name"
                label="Cohort Name"
                margin="dense"
                onChange={this.setTextValue}
                onKeyPress={ev => {
                  if (ev.key === "Enter") {
                    this.handleSave();
                  }
                }}
                type="text"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCancel} color="primary">
                Cancel
              </Button>
              <Button id="save" onClick={this.handleSave} color="primary">
                Send
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }

  setTextValue(event) {
    this.setState({ cohortName: event.target.value });
  }

  handleClick() {
    this.setState(state => ({ open: true }));
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
        let importUrl =
          "https://app.terra.bio/#import-data?format=entitiesJson";
        if (data.authorization_domain) {
          importUrl += "&ad=" + data.authorization_domain;
        }
        importUrl += "&url=" + data.url;
        window.location.assign(importUrl);
      }
    }.bind(this);
    let cohortName = this.state.cohortName;
    let filter = this.props.filter;
    if (filter == null) {
      filter = [];
    }
    if (cohortName == null) {
      cohortName = "all participants";
    }
    let params = new Object();
    params.cohortName = cohortName;
    params.filter = filter;
    this.props.exportUrlApi.exportUrlPost(
      { exportUrlRequest: params },
      exportUrlCallback
    );
  }
}

export default withStyles(styles)(ExportFab);
