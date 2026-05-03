import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

test("renders ParkNest brand", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const brandElement = screen.getByText(/parknest/i);
  expect(brandElement).toBeInTheDocument();
});
