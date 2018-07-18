import React from "react";
import ExportForm from "../../../src/components/export/ExportForm";

test("Renders correctly", () => {
  const tree = shallow(<ExportForm />);
  expect(tree).toMatchSnapshot();
});
