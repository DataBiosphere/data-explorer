import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
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
  dialogDesc: {
    color: "#333f52",
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
      borderColor: "#4d72aa !important"
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
  dialogSection: {
    display: "grid",
    gridTemplateColumns: "50px auto",
    lineHeight: "22px",
    padding: "1rem 0 1rem 0"
  },
  dialogTitle: {
    color: "#333f52",
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

class SaveButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cohortName: "",
      dialogOpen: true, // O NOT COMMIT
      dialogCohortChecked: true,
      dialogSamplesChecked: true,
      dialogParticipantsChecked: true
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleDialogSave = this.handleDialogSave.bind(this);
    this.handleDialogCancel = this.handleDialogCancel.bind(this);
    this.handleCohortNameChange = this.handleCohortNameChange.bind(this);
  }

  render() {
    const { classes, className } = this.props;

    const dialogCohortSection = (
      <div className={classes.dialogSection}>
        <Checkbox
          classes={{
            root: classes.checkboxRoot,
            checked: classes.checkboxChecked
          }}
          checked={this.state.dialogCohortChecked}
          onChange={this.handleCheckboxClick("dialogCohortChecked")}
        />
        <span className={classes.checkboxLabel}>Save cohort</span>
        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
          <p>
            Save a SQL query returning participant ids for this cohort. You can
            open saved cohorts in Data Explorer or a notebook. Also save this
            dataset's BigQuery tables, which can be{" "}
            <a
              className={classes.link}
              href="https://app.terra.bio/#workspaces/help-gatk/Terra%20Notebooks%20Playground/notebooks/launch/Py3%20-%20How%20to%20use%20a%20cohort.ipynb"
              rel="noopener noreferrer"
              target="_blank"
            >
              joined against{" "}
              <clr-icon
                shape="pop-out"
                size="12"
                style={{ margin: "-6px 4px 0 4px" }}
              />
            </a>{" "}
            the SQL query.
          </p>
          <p>
            If a cohort with this name already exists, it will be overwritten.
          </p>
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
            placeholder="cohort name is required"
            type="text"
            variant="outlined"
            disabled={!this.state.dialogCohortChecked}
          />
        </div>
      </div>
    );

    const dialogParticipantsSection = (
      <div className={classes.dialogSection}>
        <Checkbox
          classes={{
            root: classes.checkboxRoot,
            checked: classes.checkboxChecked
          }}
          checked={this.state.dialogParticipantsChecked}
          onChange={this.handleCheckboxClick("dialogParticipantsChecked")}
        />
        <span className={classes.checkboxLabel}>Save participants</span>
        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
          <p>Save a table of participant data.</p>
          <p>
            Warning: If you are saving many participants, this can take a while.
          </p>
        </div>
      </div>
    );

    const dialogSamplesSection = (
      <div className={classes.dialogSection}>
        <Checkbox
          classes={{
            root: classes.checkboxRoot,
            checked: classes.checkboxChecked
          }}
          checked={this.state.dialogSamplesChecked}
          onChange={this.handleCheckboxClick("dialogSamplesChecked")}
        />
        <span className={classes.checkboxLabel}>
          Save samples and sample set
        </span>
        <div style={{ gridColumnStart: 2, gridColumnEnd: 3 }}>
          <p>
            Save a table of sample data, as well as a sample set, representing
            this cohort. You can run workflows, view samples in IGV, and more.
          </p>
          <p>Warning: If you are saving many samples, this can take a while.</p>
        </div>
      </div>
    );

    return (
      <div className={className}>
        <TerraTooltip
          classes={{ tooltip: classes.tooltip }}
          title="Save cohort, participants, and samples"
        >
          <PrimaryButton onClick={this.handleButtonClick}>
            Save in Terra
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
              {dialogCohortSection}
              {dialogParticipantsSection}
              {dialogSamplesSection}
            </div>
            <PrimaryButton
              className={classes.dialogButton}
              disabled={
                (this.state.dialogCohortChecked && !this.state.cohortName) ||
                (!this.state.dialogCohortChecked &&
                  !this.state.dialogSamplesChecked &&
                  !this.state.dialogParticipantsChecked)
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
            "https://app.terra.bio/#import-data?" + queryStr
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
          shouldExportCohort: this.state.dialogCohortChecked,
          shouldExportParticipants: this.state.dialogParticipantsChecked,
          shouldExportSamples: this.state.dialogSamplesChecked,
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
