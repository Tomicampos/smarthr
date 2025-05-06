// src/components/ui/button.jsx
import React from "react";

export function Button({ children, ...props }) {
  return (
    <button
      {...props}
      className={
        props.className ??
        "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      }
    >
      {children}
    </button>
  );
}
