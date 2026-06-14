import React, { useState } from "react";
import { AdminLoginModal } from "./AdminLoginModal";
import { AdminDashboard } from "./AdminDashboard";

const Hamburger = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="hamburger-btn"
        onClick={() => setIsMenuOpen(true)}
      >
        ☰
      </button>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          isMenuOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-header">
          <h2>⚡ ShopLite</h2>

          <button
            className="close-btn"
            onClick={() => setIsMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-menu">
          <button className="menu-item">
            🏠 Home
          </button>

          <button className="menu-item">
            📱 Mobiles
          </button>

          <button className="menu-item">
            💻 Laptops
          </button>

          <button className="menu-item">
            🎧 Accessories
          </button>

          <button className="menu-item">
            📦 Orders
          </button>

          <button className="menu-item">
            ❤️ Wishlist
          </button>

          <button className="menu-item">
            👤 Account
          </button>

          <button className="menu-item">
            ⚙️ Settings
          </button>

          <button
            className="menu-item"
            onClick={() => {
              setShowAdminLogin(true);
              setIsMenuOpen(false);
            }}
          >
            🔐 Admin Panel
          </button>
        </nav>
      </aside>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() =>
            setShowAdminLogin(false)
          }
          onLoginSuccess={() => {
            setShowAdminLogin(false);
            setShowAdminDashboard(true);
          }}
        />
      )}

      {/* Admin Dashboard */}
      {showAdminDashboard && (
        <AdminDashboard
          onClose={() =>
            setShowAdminDashboard(false)
          }
          onProductAdded={() => {
            console.log(
              "Product added successfully"
            );

          }}
        />
      )}
    </>
  );
};

export default Hamburger;