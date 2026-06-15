import React, { useState, useEffect, useRef } from 'react';
import styles from '../css/Register.module.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SellerRegister = ({ onSuccess, onSwitchToLogin, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);

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
      const response = await fetch(`${API_BASE}/seller/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          business_name: businessName,
          business_category: businessCategory,
          business_address: businessAddress,
          business_number: businessNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed");
        return;
      }

      setSuccess(true);

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setBusinessName("");
      setBusinessCategory("");
      setBusinessAddress("");
      setBusinessNumber("");

      if (onSuccess) onSuccess();

      timerRef.current = setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin();
      }, 3000);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Seller Registration</h2>

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        {success && (
          <p className={styles.success}>
            ✅ Account created! Taking you to login...
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Full Name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Phone Number</label>
          <input
            className={styles.input}
            type="tel"
            placeholder="Phone Number"
            value={phone}
            maxLength={10}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Business Name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Business Category</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Business Category"
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Business Address</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Business Address"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Business Number</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Business Number"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            required
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
            disabled={loading || success}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </div>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <span onClick={onSwitchToLogin}>
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default SellerRegister;