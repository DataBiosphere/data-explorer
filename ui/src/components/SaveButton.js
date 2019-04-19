import React from "react";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles } from "@material-ui/core/styles";

import { buttonPrimary } from "libs/common";
import colors from "libs/colors";

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
  }
};

class SaveButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cohortName: "",
      dialogOpen: false
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleDialogSave = this.handleDialogSave.bind(this);
    this.handleDialogCancel = this.handleDialogCancel.bind(this);
    this.handleCohortNameChange = this.handleCohortNameChange.bind(this);
  }

  render() {
    const { classes } = this.props;

    const saveButton = buttonPrimary(
      {
        as: "a",
        onClick: () => this.handleButtonClick(),
        style: {
          margin: "0 16px 0 16px",
          // Not sure why this is needed. Without this, text is a bit too high.
          padding: "1px 14px 0 14px"
        }
      },
      ["Save in Terra"]
    );

    return (
      <div>
        {saveButton}
        <Dialog open={this.state.dialogOpen} onClose={this.handleClose}>
          <DialogTitle className={classes.dialogTitle} disableTypography>
            Save in Terra
          </DialogTitle>
          <DialogContent>
            <div className={classes.dialogDesc}>
              <p>A cohort with this name will be created in Terra.</p>
              <p>
                If a cohort with this name already exists, it will be
                overwritten.
              </p>
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
                  this.handleDialogSave();
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
              onClick={this.handleDialogCancel}
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
              onClick={this.handleDialogSave}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  handleCohortNameChange(event) {
    this.setState({ cohortName: event.target.value });
  }

  handleButtonClick() {
    const cohortName = !this.props.selectedFacetValues.size
      ? "all participants"
      : "";
    this.setState(state => ({ cohortName: cohortName, dialogOpen: true }));
  }

  handleDialogCancel() {
    this.setState(state => ({ dialogOpen: false }));
  }

  handleDialogSave() {
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

export default withStyles(styles)(SaveButton);
