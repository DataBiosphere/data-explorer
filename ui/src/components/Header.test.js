import React from "react";
import Header from "./Header";

test("Renders with input", () => {
  const tree = shallow(
    <Header datasetName={"Dataset Name"} totalCount={100} />
  );
  expect(tree).toMatchSnapshot();
});
