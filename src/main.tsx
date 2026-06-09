import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { loadTranslationOverrides } from "./i18n";

// Load DB-managed translation overrides (best-effort, non-blocking).
loadTranslationOverrides();

createRoot(document.getElementById("root")!).render(<App />);
