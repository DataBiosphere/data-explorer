import React from "react";
import FacetsGrid from "../../src/components/facets/FacetsGrid";
import { getFacetsList } from "../mockutils";

test("Renders correctly", () => {
  const wrapper = shallow(
    <FacetsGrid updateFacets={() => {}} facets={getFacetsList(2, 2)} />
  );
  expect(wrapper).toMatchSnapshot();
});
