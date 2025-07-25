import React from "react";
import "./GlobalLoader.css";

const GlobalLoader: React.FC<{ show: boolean }> = ({ show }) =>
  show ? (
    <div className="global-loader-overlay">
      <div className="loader"></div>
    </div>
  ) : null;

export default GlobalLoader;
