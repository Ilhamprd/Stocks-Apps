import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

/* ============================================================
   window.storage SHIM
   ------------------------------------------------------------
   App-nya dibikin pakai window.storage (async get/set) waktu
   masih jadi artifact. Di sini kita sediakan implementasi yang
   sama persis tapi disokong localStorage HP, jadi App.jsx
   nggak perlu diubah. get() mengembalikan { value } biar
   sinyaturnya identik.
   ============================================================ */
if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? null : { key, value: v };
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
        return { key, value };
      } catch {
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch {
        return null;
      }
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
