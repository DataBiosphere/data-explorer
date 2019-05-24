// Copied from terra-ui

import Color from "color";
import _ from "lodash/fp";

const ALL_COLORS = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "danger",
  "light",
  "dark"
];

const baseColors = {
  primary: "#4d72aa",
  secondary: "#6d6e70",
  accent: "#4d72aa",
  success: "#74ae43",
  warning: "#f7981c",
  danger: "#db3214",
  light: "#e9ecef",
  dark: "#333f52"
};

const colorPalettes = {
  Terra: {
    ...baseColors,
    primary: "#74ae43"
  }
};

const colors = _.fromPairs(
  _.map(
    color => [
      color,
      (intensity = 1) =>
        Color(_.get(["Terra", color], colorPalettes))
          .mix(Color("white"), 1 - intensity)
          .hex()
    ],
    ALL_COLORS
  )
);

export const terraSpecial = intensity => colors.primary(intensity);

export default colors;
