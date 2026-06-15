import React, { useState } from 'react';
import styles from '../css/Register.module.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SellerLogin = ({ onSuccess, onSwitchToRegister, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/seller/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      // ✅ FIXED
      localStorage.setItem("seller-token", data.access_token);

      if (data.seller) {
        localStorage.setItem("seller", JSON.stringify(data.seller));
      }

      setEmail("");
      setPassword("");

      // ✅ FIXED: pass seller (not user)
      if (onSuccess) {
        onSuccess(data.seller);
      }

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Seller Login</h2>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>

        <p className={styles.switchText}>
          Don't have an account?{" "}
          <span onClick={onSwitchToRegister}>Register</span>
        </p>
      </form>
    </div>
  );
};

export default SellerLogin;