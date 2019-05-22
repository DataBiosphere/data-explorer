// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import colors from "libs/colors";

export const CheckboxStyles = {
  checkboxRoot: {
    border: "1px solid " + colors.gray[5],
    borderRadius: 3,
    height: 14,
    padding: 0,
    width: 14,
    "&:hover": {
      border: "1px solid " + colors.green[1]
    },
    "&$checkboxChecked": {
      border: "1px solid " + colors.green[0],
      color: colors.green[0]
    }
  },
  checkboxChecked: {}
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
