import React, { useState } from "react";
import { AdminLoginModal } from "./AdminLoginModal";
import Profile from "./Profile";
import SellerLogin from "../Sellers/SellerLogin";
import SellerRegister from "../Sellers/SellerRegister";
import { useNavigate } from "react-router-dom";

const Hamburger = ({ onProductAdded, onOpenLogin, onAdminLoginSuccess }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const [showSellerLogin, setShowSellerLogin] = useState(false);
  const [showSellerRegister, setShowSellerRegister] = useState(false);

  const token = localStorage.getItem("token");
  const goTo = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  }

  return (
    <>
      {/* Hamburger Button */}
      <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
        ☰
      </button>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>⚡ ShopLite</h2>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="sidebar-menu">
          <button className="menu-item">🏠 Home</button>
          <button className="menu-item">📱 Mobiles</button>
          <button className="menu-item">💻 Laptops</button>
          <button className="menu-item">🎧 Accessories</button>
          <button className="menu-item">📦 Orders</button>
          <button className="menu-item" onClick={() => goTo("/wishlist")}>
            ❤️ Wishlist
          </button>

          <button
            className="menu-item"
            onClick={() => {
              setShowProfile(true);
              setIsMenuOpen(false);
            }}
          >
            👤 Account
          </button>

          <button className="menu-item">⚙️ Settings</button>

          <button
            className="menu-item"
            onClick={() => {
              setShowAdminLogin(true);
              setIsMenuOpen(false);
            }}
          >
            🔐 Admin Panel
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setShowSellerLogin(true);
              setIsMenuOpen(false);
            }}
          >
            🛍️ Seller Dashboard
          </button>

          {token ? (
            <button
              className="menu-item"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.reload();
              }}
            >
              🚪 Logout
            </button>
          ) : (
            <button
              className="menu-item"
              onClick={() => {
                onOpenLogin();
                setIsMenuOpen(false);
              }}
            >
              👤 Login
            </button>
          )}
        </nav>
      </aside>
      {showSellerLogin && (
        <SellerLogin
          onClose={() => setShowSellerLogin(false)}
          onSwitchToRegister={() => {
            setShowSellerLogin(false);
            setShowSellerRegister(true);
          }}
          onSuccess={(sellerData) => {
            setShowSellerLogin(false);

            // store seller safely
            localStorage.setItem("seller", JSON.stringify(sellerData));

            // navigate to dashboard
            navigate("/seller-dashboard");
          }}
        />
      )}

      {showSellerRegister && (
        <SellerRegister
          onClose={() => setShowSellerRegister(false)}
          onSwitchToLogin={() => {
            setShowSellerRegister(false);
            setShowSellerLogin(true);
          }}
          onSuccess={() => console.log("Seller Registered")}
        />
      )}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      {/* Admin Login Modal — on success, tell App.jsx to switch to the dashboard view */}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onLoginSuccess={() => {
            setShowAdminLogin(false);
            onAdminLoginSuccess();
          }}
        />
      )}
    </>
  );
};

export default Hamburger;
