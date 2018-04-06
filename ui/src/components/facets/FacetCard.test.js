import React from "react";
import FacetCard from "./FacetCard";
import { getFacet } from "../../../test/mockUtils";
import { MuiThemeProvider } from "material-ui";

test("Renders correctly with input", () => {
  const tree = shallow(
    <FacetCard facet={getFacet("Facet Name", 3)} updateFacet={() => {}} />
  );

  expect(tree).toMatchSnapshot();
  expect(tree.find(".listItem").length).toBe(3);
  expect(tree.find(".totalFacetValueCount").text()).toBe("60");
});
