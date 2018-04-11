import React from "react";
import FacetCard from "../../src/components/facets/FacetCard";
import { getFacet } from "../mockutils";
import { Checkbox, MuiThemeProvider } from "material-ui";
import { getMuiTheme } from "material-ui/styles";
import PropTypes from "prop-types";

test("Renders correctly", () => {
  const tree = shallow(
    <FacetCard facet={getFacet("Facet Name", 3)} updateFacet={() => {}} />
  );

  expect(tree).toMatchSnapshot();
});

test("Updates values after selecting checkboxes", () => {
  const facet = getFacet("Facet Name", 3);
  let mockUpdate = jest.fn();
  let muiTheme = getMuiTheme();
  const tree = mount(<FacetCard facet={facet} updateFacets={mockUpdate} />, {
    context: { muiTheme },
    childContextTypes: { muiTheme: PropTypes.object }
  });
  let checkboxes = tree.find(Checkbox);
  checkboxes
    .first()
    .props()
    .onCheck(null, true);
  checkboxes
    .at(1)
    .props()
    .onCheck(null, true);
  tree.setProps({ facet: facet });

  expect(mockUpdate).toHaveBeenCalledTimes(2);
  expect(tree.find(".totalFacetValueCount").text()).toBe("30");
});

test("Updates values after selecting and unselecting checkboxes", () => {
  const facet = getFacet("Facet Name", 3);
  let mockUpdate = jest.fn();
  let muiTheme = getMuiTheme();
  const tree = mount(<FacetCard facet={facet} updateFacets={mockUpdate} />, {
    context: { muiTheme },
    childContextTypes: { muiTheme: PropTypes.object }
  });
  let checkboxes = tree.find(Checkbox);
  checkboxes
    .first()
    .props()
    .onCheck(null, true);
  checkboxes
    .at(1)
    .props()
    .onCheck(null, true);
  checkboxes
    .first()
    .props()
    .onCheck(null, false);
  checkboxes
    .at(1)
    .props()
    .onCheck(null, false);
  tree.setProps({ facet: facet });

  expect(mockUpdate).toHaveBeenCalledTimes(4);
  expect(tree.find(".totalFacetValueCount").text()).toBe("60");
});
