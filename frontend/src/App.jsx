import { useProducts } from "./hooks/useProducts";
import { useCart } from "./hooks/useCart";
import { usePayment } from "./hooks/usePayment";
import { ProductGrid } from "./components/ProductGrid";
import { CartPanel } from "./components/CartPanel";
import { OrderSuccess } from "./components/OrderSuccess";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Register from "./components/Register";
import { AdminDashboard } from "./components/AdminDashboard";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Hamburger from "./components/Hamburger";
import SellerDashboard from "./Sellers/SellerDashboard";
import "./App.css";
import { ProductDetailPage } from "./components/Productdetailpage";
import  {WishlistPage}  from "./components/WishlistPage";  

export default function App() {
  const navigate = useNavigate();
  const { products, loading, error, refetch } = useProducts();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const {
    cart,
    addToCart,
    removeFromCart,
    increaseQty,
    decreaseQty,
    clearCart,
    itemCount,
    subtotal,
    tax,
    grandTotal,
    isInCart,
  } = useCart();

  const {
    initiatePayment,
    paying,
    paymentResult,
    error: paymentError,
    resetPayment,
  } = usePayment();

  const handleAddToCart = (product) => {
    addToCart(product);
    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    initiatePayment({
      amount: grandTotal,
      cart,
      onSuccess: () => {
        clearCart();
        setIsCartOpen(false);
      },
    });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <header className="app-header">
              <div className="header-inner">
                <div className="header-left">
                  <Hamburger
                    user={user}
                    onLogout={handleLogout}
                    onOpenLogin={() => setShowLogin(true)}
                    onAdminLoginSuccess={() => navigate("/admin")}
                    onProductAdded={refetch}
                  />
                  <div className="logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">ShopLite</span>
                  </div>
                </div>
                <div className="header-right">
                  <span className="header-tagline">
                    Premium tech at honest prices
                  </span>
                  {user && (
                    <div
                      className="user-pill"
                      onClick={() => setShowProfile(true)}
                      title="My Profile"
                    >
                      👤{" "}
                      <span className="user-pill-name">
                        {user.name.split(" ")[0]}
                      </span>
                    </div>
                  )}
                  <div
                    className="cart-pill"
                    onClick={() => setIsCartOpen(true)}
                  >
                    🛒{" "}
                    <span>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <main className="app-main">
              <ProductGrid
                products={products}
                loading={loading}
                error={error}
                onAddToCart={handleAddToCart}
                isInCart={isInCart}
              />
              {isCartOpen && (
                <>
                  <div
                    className="cart-overlay"
                    onClick={() => setIsCartOpen(false)}
                  />
                  <CartPanel
                    cart={cart}
                    onIncrease={increaseQty}
                    onDecrease={decreaseQty}
                    onRemove={removeFromCart}
                    onClear={clearCart}
                    itemCount={itemCount}
                    subtotal={subtotal}
                    tax={tax}
                    grandTotal={grandTotal}
                    onCheckout={handleCheckout}
                    paying={paying}
                    paymentError={paymentError}
                    onClose={() => setIsCartOpen(false)}
                    user={user}
                    onOpenLogin={() => {
                      setIsCartOpen(false);
                      setShowLogin(true);
                    }}
                  />
                </>
              )}
            </main>

            {paymentResult && (
              <OrderSuccess
                paymentId={paymentResult.payment_id}
                orderId={paymentResult.order_id}
                onContinue={resetPayment}
              />
            )}

            {showLogin && (
              <Login
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
                onClose={() => setShowLogin(false)}
              />
            )}

            {showRegister && (
              <Register
                onSuccess={() => {}}
                onSwitchToLogin={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
                onClose={() => setShowRegister(false)}
              />
            )}

            {showProfile && (
              <Profile
                user={user}
                onClose={() => setShowProfile(false)}
                onLogout={() => {
                  handleLogout();
                  setShowProfile(false);
                }}
              />
            )}

            <footer className="app-footer">
              <p>
                ShopLite · Powered by React + FastAPI + Razorpay · Prices
                include GST
              </p>
            </footer>
          </div>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminDashboard
            onClose={() => navigate("/")}
            onProductAdded={() => { if (refetch) refetch(); }}
            onSessionExpired={() => {
              localStorage.removeItem("admin_token");
              navigate("/");
            }}
          />
        }
      />

      <Route path="/seller-dashboard" element={<SellerDashboard />} />

      <Route
        path="/product/:id"
        element={<ProductDetailPage onAddToCart={addToCart} isInCart={isInCart} />}
      />

      {/* ── Wishlist route ── */}
      <Route
        path="/wishlist"
        element={<WishlistPage onAddToCart={addToCart} isInCart={isInCart} />}
      />

    </Routes>
  );
}