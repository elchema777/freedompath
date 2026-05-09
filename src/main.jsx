import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

async function sGet(key) {
  try { const r = await window.storage.get(key); return r ? r.value : null; }
  catch { return null; }
}
async function sSet(key, val) {
  try { await window.storage.set(key, typeof val === "string" ? val : JSON.stringify(val)); }
  catch(e) { console.warn("storage.set failed", key, e); }
}

const root = document.getElementById("root");
createRoot(root).render(<App />);
