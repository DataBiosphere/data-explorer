// Copied from terra-ui

import colors from "./colors";

export const standardShadow = "0 3px 2px 0 rgba(0,0,0,0.12)";
export const modalShadow =
  "0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)";

export const elements = {
  cardTitle: { color: colors.accent(), fontSize: 16 },
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRadius: 5,
    padding: "1rem",
    wordWrap: "break-word",
    backgroundColor: "white",
    boxShadow:
      "0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12), 0 0 2px 0 rgba(0,0,0,0.12)"
  }
};
