import { useProducts } from "./hooks/useProducts";
import { useCart } from "./hooks/useCart";
import { usePayment } from "./hooks/usePayment";
import { ProductGrid } from "./components/ProductGrid";
import { CartPanel } from "./components/CartPanel";
import { OrderSuccess } from "./components/OrderSuccess";
import { useState } from "react";
import Hamburger from './components/Hamburger'
import "./App.css";

export default function App() {
  const { products, loading, error } = useProducts();
  const [isCartOpen, setIsCartOpen] = useState(false);
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
      },
    });
  };

  const handleContinueShopping = () => {
    resetPayment();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
          <Hamburger />
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ShopLite</span>
          </div>
          </div>
          <div className="header-right">
            <span className="header-tagline">
              Premium tech at honest prices
            </span>
            <div className="cart-pill" onClick={() => setIsCartOpen(true)}>
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
            <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
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
            />
          </>
        )}
      </main>

      {paymentResult && (
        <OrderSuccess
          paymentId={paymentResult.payment_id}
          orderId={paymentResult.order_id}
          onContinue={handleContinueShopping}
        />
      )}

      <footer className="app-footer">
        <p>
          ShopLite · Powered by React + FastAPI + Razorpay · Prices include GST
        </p>
      </footer>
    </div>
  );
}
