"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f4faf4", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e8f5e9", borderRadius: 18, padding: 40, maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ color: "#14532d", margin: "0 0 8px" }}>CVSU LMS hit a snag</h1>
            <p style={{ color: "#5f6b76", fontSize: 14 }}>A critical error stopped the app from rendering.</p>
            {process.env.NODE_ENV === "development" && (
              <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 12 }}>{error.message}</p>
            )}
            <button
              onClick={reset}
              style={{ marginTop: 20, background: "#1b5e20", color: "#fff", border: "none", borderRadius: 999, padding: "10px 28px", fontWeight: 700, cursor: "pointer" }}
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
