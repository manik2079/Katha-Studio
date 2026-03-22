import { useEffect, useState } from "react";
import KathaStudio from "./KathaStudio.jsx";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = darkMode ? "#060505" : "#f3ede3";
    document.body.style.color = darkMode ? "#f7ebd1" : "#2c180f";
    document.body.style.fontFamily = "'Inter', 'Segoe UI', sans-serif";
  }, [darkMode]);

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#060505" : "#f3ede3" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 22px",
          backdropFilter: "blur(18px)",
          background: darkMode
            ? "linear-gradient(180deg, rgba(11,9,9,0.88), rgba(11,9,9,0.74))"
            : "linear-gradient(180deg, rgba(255,249,241,0.9), rgba(255,249,241,0.74))",
          borderBottom: `1px solid ${darkMode ? "rgba(255,236,201,0.08)" : "rgba(99,58,24,0.10)"}`,
        }}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: darkMode ? "rgba(247,235,209,0.58)" : "rgba(87,48,20,0.58)" }}>
            Regional story-to-reels pipeline
          </div>
          <div style={{ fontSize: 28, fontFamily: "Georgia, serif" }}>Katha Studio</div>
        </div>
        <button
          onClick={() => setDarkMode((current) => !current)}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "12px 18px",
            cursor: "pointer",
            fontWeight: 700,
            background: darkMode ? "linear-gradient(135deg, #f0c58e, #c86d3b)" : "linear-gradient(135deg, #7d3f22, #b65e31)",
            color: darkMode ? "#1e1009" : "#fff8f0",
          }}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <KathaStudio darkMode={darkMode} />
    </div>
  );
}
