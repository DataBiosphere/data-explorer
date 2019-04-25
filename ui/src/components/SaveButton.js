import React from "react";
import classNames from "classnames";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import { PrimaryButton, SecondaryButton, TerraTooltip } from "libs/common";
import { filterMapToArray } from "libs/util";

const styles = {
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
  dialogButton: {
    float: "right",
    margin: "36px 0 0 24px"
  },
  dialogTitle: {
    color: colors.gray[0],
    fontSize: 18,
    fontWeight: 600
  },
  tooltip: {
    width: 200
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
    const { classes, className } = this.props;

    return (
      <div className={className}>
        <TerraTooltip
          classes={{ tooltip: classes.tooltip }}
          title="Save cohorts so you can work with them later"
        >
          <PrimaryButton onClick={this.handleButtonClick}>
            Save in Terra
          </PrimaryButton>
        </TerraTooltip>
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
            <PrimaryButton
              className={classes.dialogButton}
              disabled={
                !("cohortName" in this.state) || this.state.cohortName == ""
              }
              onClick={this.handleDialogSave}
            >
              Save
            </PrimaryButton>
            <SecondaryButton
              className={classes.dialogButton}
              onClick={this.handleDialogCancel}
            >
              Cancel
            </SecondaryButton>
          </DialogContent>
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
          filter: filterMapToArray(this.props.selectedFacetValues)
        }
      },
      exportUrlCallback
    );
  }
}

export default withStyles(styles)(SaveButton);
