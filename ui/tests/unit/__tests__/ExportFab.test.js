import React from "react";
import ExportFab from "../../../src/components/ExportFab";
import { getMuiTheme } from "material-ui/styles/index";
import { mockExportUrlPost } from "../../../src/api/src/api/ExportUrlApi";
import Button from "@material-ui/core/Button";
import PropTypes from "prop-types";
import ExportUrlApi from "../../../src/api/src/api/ExportUrlApi";
import ApiClient from "../../../src/api/src/ApiClient";

jest.mock("../../../src/api/src/api/ExportUrlApi");
("use strict");

beforeEach(() => {
  mockExportUrlPost.mockClear();
});

test("Renders correctly", () => {
  const tree = shallow(
    <ExportFab exportUrlApi={new ExportUrlApi(new ApiClient())} />
  );
  expect(tree).toMatchSnapshot();
});

test("Calls API and redirects on click", () => {
  window.location.assign = jest.fn();
  let muiTheme = getMuiTheme();
  const tree = mount(
    <ExportFab exportUrlApi={new ExportUrlApi(new ApiClient())} />,
    {
      context: { muiTheme },
      childContextTypes: { muiTheme: PropTypes.object }
    }
  );
  let exportButton = tree.find(Button);
  exportButton
    .first()
    .props()
    .onClick();
  expect(mockExportUrlPost).toHaveBeenCalledTimes(1);
  expect(window.location.assign).toBeCalledWith(
    "https://bvdp-saturn-prod.appspot.com/#import-data?format=entitiesJson&url=exportUrl"
  );
});
