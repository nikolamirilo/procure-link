"use client";

import { useEffect } from "react";

// Last-resort boundary: catches errors in the root layout itself, so it renders
// its own <html>/<body> and cannot use the i18n provider. Text is in Serbian
// (the default locale) and kept deliberately minimal.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="sr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Nešto je pošlo naopako
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Došlo je do neočekivane greške. Pokušajte ponovo.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.2rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Pokušaj ponovo
          </button>
        </div>
      </body>
    </html>
  );
}
