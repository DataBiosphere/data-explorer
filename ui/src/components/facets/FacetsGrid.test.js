import React from "react";
import FacetsGrid from "./FacetsGrid";
import { getFacetsList } from "../../../test/mockUtils";

test("Renders with input", () => {
  const wrapper = shallow(
    <FacetsGrid updateFacets={() => {}} facets={getFacetsList(4, 6)} />
  );
  expect(wrapper).toMatchSnapshot();
});

test("Renders with empty Facets list", () => {
  const wrapper = shallow(<FacetsGrid updateFacets={() => {}} facets={[]} />);
  expect(wrapper).toMatchSnapshot();
});
