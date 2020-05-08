import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";

import { CheckboxStyles } from "libs/icons";
import colors from "libs/colors";
import { PrimaryButton, SecondaryButton, TerraTooltip } from "libs/common";
import { filterMapToArray } from "libs/util";

const styles = {
  ...CheckboxStyles,
  checkboxLabel: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "-3px 0 6px 0"
  },
  dialogCohortNameError: {
    color: colors.danger(),
    fontSize: 12
  },
  dialogDesc: {
    color: colors.dark(),
    fontSize: 14
  },
  dialogInputInput: {
    color: colors.secondary(),
    fontSize: 14,
    padding: "10px 12px 6px 12px"
  },
  dialogInputRoot: {
    margin: "5px 0 16px 0",
    "&:hover $dialogInputNotchedOutline": {
      borderColor: "#ced0da !important"
    },
    "&$dialogInputCssFocused $dialogInputNotchedOutline": {
      borderColor: colors.primary() + " !important"
    }
  },
  dialogInputCssFocused: {},
  dialogInputNotchedOutline: {
    borderColor: "#dfe3e9 !important",
    borderWidth: "1px !important"
  },
  dialogInputRootCohortNameInvalid: {
    margin: "5px 0 16px 0",
    "&:hover $dialogInputNotchedOutline": {
      borderColor: colors.danger() + " !important"
    },
    "&$dialogInputCssFocused $dialogInputNotchedOutline": {
      borderColor: colors.danger() + " !important"
    }
  },
  dialogInputNotchedOutlineCohortNameInvalid: {
    borderColor: colors.danger() + " !important",
    borderWidth: "1px !important"
  },
  dialogButton: {
    float: "right",
    margin: "36px 0 0 24px"
  },
  dialogSection: {
    display: "grid",
    gridTemplateColumns: "50px auto",
    lineHeight: "22px",
    padding: "1rem 0 1rem 0"
  },
  dialogTitle: {
    color: colors.dark(),
    fontSize: 18,
    fontWeight: 600
  },
  link: {
    color: "#295699",
    textDecoration: "none"
  },
  tooltip: {
    width: 200
  }
};

function isCohortNameValid(cohortName) {
  return /^[\w-_]+$/.test(cohortName);
}

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
          title="Save cohort so you can work with it later"
        >
          <PrimaryButton onClick={this.handleButtonClick}>
            Save cohort
          </PrimaryButton>
        </TerraTooltip>
        <Dialog
          onClose={this.handleClose}
          open={this.state.dialogOpen}
          // Without this, dialog appears too low when embedded in Terra
          scroll="body"
        >
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
                  root:
                    !this.state.cohortName ||
                    isCohortNameValid(this.state.cohortName)
                      ? classes.dialogInputRoot
                      : classes.dialogInputRootCohortNameInvalid,
                  focused: classes.dialogInputCssFocused,
                  input: classes.dialogInputInput,
                  notchedOutline:
                    !this.state.cohortName ||
                    isCohortNameValid(this.state.cohortName)
                      ? classes.dialogInputNotchedOutline
                      : classes.dialogInputNotchedOutlineCohortNameInvalid
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
            {!isCohortNameValid(this.state.cohortName) &&
              this.state.cohortName && (
                <div className={classes.dialogCohortNameError}>
                  Cohort name can only contain letters, numbers, dashes and
                  underscores
                </div>
              )}
            <PrimaryButton
              className={classes.dialogButton}
              disabled={!isCohortNameValid(this.state.cohortName)}
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
      ? "all_participants"
      : "";
    this.setState(state => ({ cohortName: cohortName, dialogOpen: true }));
  }

  handleCheckboxClick = name => event => {
    this.setState({ [name]: event.target.checked });
  };

  handleDialogCancel() {
    this.setState(state => ({ dialogOpen: false }));
  }

  handleDialogSave() {
    this.setState(state => ({ dialogOpen: false }));
    let exportUrlCallback = function(error, data) {
      if (error) {
        alert(error.response.body.detail);
      } else {
        let queryStr = "format=entitiesJson";
        if (data.authorization_domain) {
          queryStr += "&ad=" + data.authorization_domain;
        }
        // - From Terra Data tab, user opens a cohort in DE.
        // - wid is set to workspace id of workspace that contains cohort.
        // - Here we pass wid to import-data, so workspace is selected in
        //   drop-down by default.
        const wid = new URLSearchParams(window.location.search).get("wid");
        if (wid) {
          queryStr += "&wid=" + wid;
        }
        queryStr += "&url=" + data.url;
        if (this.props.embed && "parentIFrame" in window) {
          // Don't set targetOrigin because it's unknown. It could be
          // app.terra.bio, bvdp-saturn-dev.appspot.com, etc.
          window.parentIFrame.sendMessage({ importDataQueryStr: queryStr });
        } else {
          window.location.assign(
            "https://ukbiobank.terra.bio/#import-data?" + queryStr
          );
        }
      }
    }.bind(this);

    var dataExplorerUrl;
    if (this.props.embed) {
      dataExplorerUrl =
        "https://app.terra.bio/#library/datasets/" +
        this.props.datasetName +
        "/data-explorer" +
        window.location.search.replace("embed=&", "");
    } else {
      dataExplorerUrl = window.location.href;
    }

    this.props.exportUrlApi.exportUrlPost(
      {
        exportUrlRequest: {
          cohortName: this.state.cohortName,
          dataExplorerUrl: dataExplorerUrl,
          filter: filterMapToArray(this.props.selectedFacetValues)
        }
      },
      exportUrlCallback
    );
  }
}

export default withStyles(styles)(SaveButton);
