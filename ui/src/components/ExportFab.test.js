import React from "react";
import ExportFab from "./ExportFab";

test("Renders correctly", () => {
  const tree = shallow(<ExportFab />);
  expect(tree).toMatchSnapshot();
});
