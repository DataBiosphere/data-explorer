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
