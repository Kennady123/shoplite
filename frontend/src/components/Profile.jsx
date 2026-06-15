import React, { useState } from "react";
import styles from "../css/Register.module.css";

const Profile = ({ onClose }) => {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  const [name, setName] = useState(storedUser.name || "");
  const [email, setEmail] = useState(storedUser.email || "");
  const [phone, setPhone] = useState(storedUser.phone || "");
  const [success, setSuccess] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();

    const updatedUser = {
      ...storedUser,
      name,
      email,
      phone,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleUpdate}>
        <h2 className={styles.title}>My Profile</h2>

        {success && (
          <p className={styles.success}>
            ✅ Profile updated successfully
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
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Close
          </button>

          <button
            className={styles.button}
            type="submit"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;