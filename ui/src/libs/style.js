// Copied from https://github.com/DataBiosphere/saturn-ui/blob/master/src/libs/style.js

import colors from "./colors";

export const standardShadow = "0 3px 2px 0 rgba(0,0,0,0.12)";
export const modalShadow =
  "0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)";

export const standardLine = `1px solid ${colors.gray[2]}`;

export const elements = {
  cardTitle: { color: colors.blue[0], fontSize: 16 },
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
  },
  input: {
    style: {
      border: `1px solid ${colors.gray[3]}`,
      borderRadius: 4,
      height: "2.25rem"
    }
  },
  pageTitle: {
    color: colors.darkBlue[0],
    fontSize: 22,
    fontWeight: 500,
    textTransform: "uppercase"
  },
  sectionHeader: { color: colors.darkBlue[0], fontSize: 16, fontWeight: 600 }
};
