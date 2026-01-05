import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";

const root = document.getElementById("app");

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);