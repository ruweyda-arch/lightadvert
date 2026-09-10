"use client";

import { useEffect } from "react";

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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#666", fontSize: "0.875rem", margin: "0.5rem 0 1rem" }}>
            The app hit an unexpected error. Reload the page, and tell an administrator
            if it keeps happening{error.digest ? ` (ref ${error.digest})` : ""}.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: "2.25rem",
              padding: "0 1rem",
              borderRadius: "0.375rem",
              border: 0,
              background: "#171717",
              color: "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
