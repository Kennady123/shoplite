import React, { useState, useEffect, useRef } from 'react'
import styles from '../css/Register.module.css'

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const Login = ({ onSuccess, onSwitchToRegister, onClose }) => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      // FIX: no mountedRef check here — always show error
      if (!response.ok) {
        setError(data.detail || "Incorrect email or password");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (mountedRef.current) {
        setEmail("");
        setPassword("");
      }

      if (onSuccess) onSuccess(data.user);
      alert("Login successful!");

    } catch (err) {
      // FIX: no mountedRef check — always show error
      setError("Something went wrong. Please try again.");
    } finally {
      // FIX: no mountedRef check — always clear loading
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>

        <h2 className={styles.title}>Login</h2>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
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

export default Login;