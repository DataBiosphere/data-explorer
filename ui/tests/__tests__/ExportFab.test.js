import React from "react";
import ExportFab from "../../src/components/ExportFab";

test("Renders correctly", () => {
  const tree = shallow(<ExportFab />);
  expect(tree).toMatchSnapshot();
});
