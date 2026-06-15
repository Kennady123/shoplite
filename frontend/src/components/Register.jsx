import React, { useState, useEffect, useRef } from 'react'
import styles from '../css/Register.module.css'

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const Register = ({ onSuccess, onSwitchToLogin, onClose }) => {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const timerRef = useRef(null);

  // Cleanup timer on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password })
      });

      const data = await response.json();

      // FIX: removed mountedRef — always show error
      if (!response.ok) {
        setError(data.detail || "Registration failed");
        return;
      }

      // FIX: removed mountedRef — always update state
      setSuccess(true);
      setName(""); setEmail(""); setPhone(""); setPassword("");
      if (onSuccess) onSuccess();

      // Auto switch to login after 3 seconds
      timerRef.current = setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin();
      }, 3000);

    } catch (err) {
      // FIX: removed mountedRef — always show error
      setError("Something went wrong. Please try again.");
    } finally {
      // FIX: removed mountedRef — always clear loading
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>

        <h2 className={styles.title}>Create Account</h2>

        {error && <p className={styles.error}>{error}</p>}

        {success && (
          <p className={styles.success}>
            ✅ Account created! Taking you to login...
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Full Name</label>
          <input id="name" className={styles.input} type="text"
            placeholder="Full Name" value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input id="email" className={styles.input} type="email"
            placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">Phone Number</label>
          <input id="phone" className={styles.input} type="tel"
            placeholder="Phone Number" value={phone} maxLength={10}
            onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input id="password" className={styles.input} type="password"
            placeholder="Min 6 characters" value={password}
            onChange={(e) => setPassword(e.target.value)} />
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
            disabled={loading || success}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </div>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <span onClick={onSwitchToLogin}>Login</span>
        </p>

      </form>
    </div>
  );
};

export default Register;