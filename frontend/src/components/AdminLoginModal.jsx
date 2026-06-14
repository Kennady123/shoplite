import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function AdminLoginModal({
  onClose,
  onLoginSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Invalid credentials"
        );
      }

      const data = await res.json();

      localStorage.setItem(
        "admin_token",
        data.access_token
      );

      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-overlay">
      <div className="admin-modal">

        <h2 className="admin-title">
          Admin Login
        </h2>

        <input
          className="admin-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="admin-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        <div className="admin-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn-primary"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading
              ? "Logging In..."
              : "Login"}
          </button>
        </div>

      </div>
    </div>
  );
}