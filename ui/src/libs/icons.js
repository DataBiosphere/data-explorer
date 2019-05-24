// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import colors from "libs/colors";

export const CheckboxStyles = {
  checkboxRoot: {
    border: "1px solid " + colors.dark(0.55),
    borderRadius: 3,
    height: 14,
    padding: 0,
    width: 14,
    "&:hover": {
      border: "1px solid #74ae43"
    },
    "&$checkboxChecked": {
      border: "1px solid #5c912e",
      color: "#295699"
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
