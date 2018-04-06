import React from "react";
import ReactDOM from "react-dom";
import App from "../../src/App";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

test("Renders the app", () => {
  const tree = shallow(<App />);
  expect(tree).toMatchSnapshot();
});
