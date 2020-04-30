import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import { PrimaryButton, SecondaryButton, TerraTooltip } from "libs/common";
import { filterMapToArray } from "libs/util";

const styles = {
  dialogDesc: {
    color: colors.dark(),
    fontSize: 14
  },
  dialogInputInput: {
    color: colors.secondary(),
    fontSize: 14,
  },
  dialogInputRoot: {
    padding: "12px",
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
  tooltip: {
    width: 200
  }
};

class CopyQueryButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: "",
      dialogOpen: false
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
  }

  render() {
    const { classes, className } = this.props;

    return (
      <div className={className}>
        <TerraTooltip
          classes={{ tooltip: classes.tooltip }}
          title="Copy cohort query to clipboard"
        >
          <PrimaryButton onClick={this.handleButtonClick}>
            Copy cohort query
          </PrimaryButton>
        </TerraTooltip>
        <Dialog
          onClose={this.handleClose}
          open={this.state.dialogOpen}
          // Without this, dialog appears too low when embedded in Terra
          scroll="body"
        >
          <DialogTitle className={classes.dialogTitle} disableTypography>
            Copy cohort query to clipboard
          </DialogTitle>
          <DialogContent>
            <div className={classes.dialogDesc}>
              <p>This query returns you the list of participants of this cohort.</p>
            </div>
            <TextField
              autoFocus
              value={this.state.queryText}
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
              onKeyPress={ev => {
                if (ev.key === "Enter") {
                  this.handleDialogClose();
                }
              }}
              placeholder="Query should be here"
              type="text"
              variant="outlined"
              multiline
              rowsMax="10"
            />
            <CopyToClipboard text={this.state.queryText}>
              <PrimaryButton
                className={classes.dialogButton}
              >
                Copy to Clipboard
              </PrimaryButton>
            </CopyToClipboard>
            <SecondaryButton
              className={classes.dialogButton}
              onClick={this.handleDialogClose}
            >
              Close
            </SecondaryButton>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  handleQueryTextChange(event) {
    this.setState({ queryText: event.target.value });
  }

  handleButtonClick() {
    let exportUrlCallback = function(error, data) {
      if (error) {
        alert(error.response.body.detail);
      } else {
        // We put the query in the url field as a hack.
        // We'd need to update the ExportUrl Model to do this properly.
        var query = data.url
        this.setState(state => ({ queryText: query, dialogOpen: true }));
      }
    }.bind(this)
    var dataExplorerUrl = window.location.href;
    // This is a signal to the api to return query only.
    const cohortName = "QUERY_ONLY_f4fef853-bdc5-486e-8aa0-0e524bd6685a"
    this.props.exportUrlApi.exportUrlPost(
      {
        exportUrlRequest: {
          cohortName: cohortName,
          dataExplorerUrl: dataExplorerUrl,
          filter: filterMapToArray(this.props.selectedFacetValues)
        }
      },
      exportUrlCallback
    );
    
  }

  handleDialogClose() {
    this.setState(state => ({ dialogOpen: false }));
  }

}

export default withStyles(styles)(CopyQueryButton);
