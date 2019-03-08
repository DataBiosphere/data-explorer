// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import React from "react";

import colors from "libs/colors";

export const CheckboxStyles = {
  checkboxRoot: {
    border: "1px solid " + colors.gray[5],
    borderRadius: 3,
    height: 14,
    width: 14,
    "&:hover": {
      border: "1px solid " + colors.green[1]
    },
    "&$checkboxChecked": {
      border: "1px solid " + colors.green[0]
    }
  },
  checkboxChecked: {},
  checkedIcon: {
    fill: colors.green[1],
    height: 16,
    width: 16,
    // Needed for hover color to work
    zIndex: 2,
    "&:hover": {
      fill: colors.green[2]
    }
  }
};

export const DownAngleStyles = {
  downAngle: {
    height: 12,
    width: 20
  }
};

export const TerraLogoStyles = {
  terraLogo: {
    fill: "white",
    height: 75,
    marginRight: 2,
    width: 75
  }
};
