import { useState } from "react";
import s from "../css/AdminLoginModal.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function AdminLoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("admin_token", data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.adminOverlay}>
      <div className={s.adminModal}>
        <h2 className={s.adminTitle}>Admin Login</h2>

        <input
          className={s.adminInput}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className={s.adminInput}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={s.adminError}>{error}</p>}

        <div className={s.adminActions}>
          <button className={s.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button className={s.btnPrimary} disabled={loading} onClick={handleLogin}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}