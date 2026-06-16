import { formatINR } from "../utils/format";
import { useState, useEffect, useRef } from "react";

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  // item.price is the raw base price stored in cart.
  // Multiply by 1.18 for the GST-inclusive display price.
  const itemPrice = item.price * 1.18;

  return (
    <div className="cart-item">
      <span className="cart-item-emoji">{item.image_emoji}</span>
      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-unit">{formatINR(itemPrice)} each</p>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.id)}>−</button>
        <span className="qty-value">{item.quantity}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.id)}>+</button>
      </div>
      <div className="cart-item-right">
        <p className="cart-item-total">{formatINR(itemPrice * item.quantity)}</p>
        <button className="remove-btn" onClick={() => onRemove(item.id)} title="Remove">✕</button>
      </div>
    </div>
  );
}

export function CartPanel({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  itemCount,
  subtotal,
  tax,
  grandTotal,
  onCheckout,
  paying,
  paymentError,
  onClose,
  user,
  onOpenLogin,
}) {
  const [loginMsg, setLoginMsg]   = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef                  = useRef(null);

  const handleCheckout = () => {
    if (!user) {
      setLoginMsg(true);
      setCountdown(3);
      return;
    }
    onCheckout();
  };

  // Countdown logic
  useEffect(() => {
    if (!loginMsg) return;

    if (timerRef.current) clearInterval(timerRef.current);

    let count = 3;
    setCountdown(count);

    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setLoginMsg(false);

        onOpenLogin();
        onClose();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loginMsg]);

  return (
    <aside className="cart-panel">
      <div className="cart-drag-handle"><span /></div>
      <div className="cart-header">
        <h2 className="cart-title">
          Cart
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </h2>
        <div className="cart-header-actions">
          {cart.length > 0 && (
            <button className="btn-ghost" onClick={onClear}>Clear all</button>
          )}
          <button className="cart-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <span className="empty-icon">🛒</span>
          <p className="empty-title">Your cart is empty</p>
          <p className="empty-sub">Add products to get started</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal (excl. GST)</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>GST (18% incl.)</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>

            {loginMsg && (
              <div style={{
                background: "rgba(167, 139, 250, 0.1)",
                border: "1px solid #a78bfa",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "12px",
                textAlign: "center",
                lineHeight: "1.7",
              }}>
                <span style={{ fontSize: "1rem" }}>🔐</span>
                <span style={{
                  display: "block",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                  color: "#c4b5fd",
                  marginTop: "4px",
                }}>
                  Please login to continue
                </span>
                <span style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "#a78bfa",
                  marginTop: "4px",
                }}>
                  Taking you to login in {countdown}s...
                </span>
              </div>
            )}

            {paymentError && (
              <div className="payment-error">
                ⚠️ {paymentError}
              </div>
            )}

            <button
              className={`btn-checkout ${paying ? "btn-paying" : ""}`}
              onClick={handleCheckout}
              disabled={paying || loginMsg}
            >
              {paying ? "Processing…" : "Proceed to Checkout →"}
            </button>

            <p className="secure-note">🔒 Secured by Razorpay</p>
          </div>
        </>
      )}
    </aside>
  );
}