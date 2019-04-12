import React from "react";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import Tooltip from "@material-ui/core/Tooltip";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import { ReactComponent as ExportButton } from "libs/icons/export_to_terra.svg";

const styles = {
  dialogButtonBase: {
    boxShadow: "unset",
    color: colors.green[0],
    fontSize: 16,
    margin: "0 25px 26px 0",
    padding: "10px 20px 8px 20px"
  },
  dialogButtonCancel: {
    // Add an invisible border so the button doesn't move when we click it
    border: "1px solid white",
    "&:hover": {
      backgroundColor: "#e9edf1",
      border: "1px solid #babdc0",
      borderRadius: 3
    },
    "&:active": {
      backgroundColor: "#e9edf1",
      border: "1px solid #babdc0",
      borderRadius: 3
    }
  },
  dialogButtonSave: {
    backgroundColor: colors.green[1],
    border: "1px solid #5c8b35",
    borderRadius: 3,
    color: "white",
    "&:hover": {
      backgroundColor: "#7cb24e",
      border: "1px solid #638e3e"
    },
    "&:active": {
      backgroundColor: "#63953a",
      border: "1px solid #638e3e"
    }
  },
  dialogButtonSaveDisabled: {
    backgroundColor: "#e9edf1",
    border: "1px solid #babdc0",
    color: "#babdc0"
  },
  dialogDesc: {
    color: colors.gray[0],
    fontSize: 14
  },
  dialogInputInput: {
    color: colors.gray[0],
    fontSize: 14,
    padding: "10px 12px 6px 12px"
  },
  dialogInputRoot: {
    margin: "22px 0 30px 0",
    "&:hover $dialogInputNotchedOutline": {
      borderColor: "#ced0da !important"
    },
    "&$dialogInputCssFocused $dialogInputNotchedOutline": {
      borderColor: colors.green[1] + " !important"
    }
  },
  dialogInputCssFocused: {},
  dialogInputNotchedOutline: {
    borderColor: "#dfe3e9 !important",
    borderWidth: "1px !important"
  },
  dialogTitle: {
    color: colors.gray[0],
    fontSize: 18,
    fontWeight: 600
  },
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
    this.state = {
      cohortName: "",
      dialogOpen: false
    };
    this.handleFabClick = this.handleFabClick.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleCohortNameChange = this.handleCohortNameChange.bind(this);
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        {/*
          Style div instead of button itself, to prevent button from moving to
          the right when cohort dialog is shown. See
          https://github.com/mui-org/material-ui/issues/9275#issuecomment-350479467
        */}
        <div className={"mui-fixed " + classes.exportFab}>
          <Tooltip title="Save in Terra">
            <ExportButton
              className={classes.exportButton}
              onClick={() => this.handleFabClick()}
            />
          </Tooltip>
        </div>
        <div>
          <Dialog
            className={classes.dialogRoot}
            open={this.state.dialogOpen}
            onClose={this.handleClose}
          >
            <DialogTitle className={classes.dialogTitle} disableTypography>
              Save in Terra
            </DialogTitle>
            <DialogContent>
              <div className={classes.dialogDesc}>
                A cohort with this name will be created in Terra
              </div>
              <TextField
                autoFocus
                value={this.state.cohortName}
                fullWidth
                id="name"
                InputProps={{
                  classes: {
                    root: classes.dialogInputRoot,
                    focused: classes.dialogInputCssFocused,
                    input: classes.dialogInputInput,
                    notchedOutline: classes.dialogInputNotchedOutline
                  }
                }}
                onChange={this.handleCohortNameChange}
                onKeyPress={ev => {
                  if (ev.key === "Enter") {
                    this.handleSave();
                  }
                }}
                placeholder="cohort name"
                type="text"
                variant="outlined"
              />
            </DialogContent>
            <DialogActions>
              <Button
                className={classNames(
                  classes.dialogButtonBase,
                  classes.dialogButtonCancel
                )}
                onClick={this.handleCancel}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                classes={{
                  root: classNames(
                    classes.dialogButtonBase,
                    classes.dialogButtonSave
                  ),
                  disabled: classNames(
                    classes.dialogButtonBase,
                    classes.dialogButtonSaveDisabled
                  )
                }}
                disabled={
                  !("cohortName" in this.state) || this.state.cohortName == ""
                }
                variant="contained"
                id="save"
                onClick={this.handleSave}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }

  handleCohortNameChange(event) {
    this.setState({ cohortName: event.target.value });
  }

  handleFabClick() {
    const cohortName = this.props.filter.length === 0 ? "all participants" : "";
    this.setState(state => ({ cohortName: cohortName, dialogOpen: true }));
  }

  handleCancel() {
    this.setState(state => ({ dialogOpen: false }));
  }

  handleSave() {
    this.setState(state => ({ dialogOpen: false }));
    let exportUrlCallback = function(error, data) {
      if (error) {
        alert(error.response.body.detail);
      } else {
        let importUrl =
          "https://app.terra.bio/#import-data?format=entitiesJson";
        if (data.authorization_domain) {
          importUrl += "&ad=" + data.authorization_domain;
        }
        // - From Terra Data tab, user opens a cohort in DE.
        // - wid is set to workspace id of workspace that contains cohort.
        // - Here we pass wid to import-data, so workspace is selected in
        //   drop-down by default.
        const wid = new URLSearchParams(window.location.search).get("wid");
        if (wid) {
          importUrl += "&wid=" + wid;
        }
        importUrl += "&url=" + data.url;
        window.location.assign(importUrl);
      }
    }.bind(this);
    this.props.exportUrlApi.exportUrlPost(
      {
        exportUrlRequest: {
          cohortName: this.state.cohortName,
          dataExplorerUrl: window.location.href,
          filter: this.props.filter
        }
      },
      exportUrlCallback
    );
  }
}

export default withStyles(styles)(ExportFab);
