import React from "react";

export default function Logo({ dark, size = 120 }) {
  return (
    <img
      src={dark ? "/logo_modooscuro.png" : "/logo_modoclaro.png"}
      alt="Timeo"
      style={{
        height: size,
        width: "auto",
        display: "block"
      }}
    />
  );
}