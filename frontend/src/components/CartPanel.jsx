import { formatINR } from "../utils/format";

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item">
      <span className="cart-item-emoji">{item.image_emoji}</span>
      <div className="cart-item-info">
        <p className="cart-item-name">{item.name}</p>
        <p className="cart-item-unit">{formatINR(item.price)} each</p>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.id)}>−</button>
        <span className="qty-value">{item.quantity}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.id)}>+</button>
      </div>
      <div className="cart-item-right">
        <p className="cart-item-total">{formatINR(item.price * item.quantity)}</p>
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
}) {
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
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>GST (18%)</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>

            {/* Payment error message */}
            {paymentError && (
              <div className="payment-error">
                ⚠️ {paymentError}
              </div>
            )}

            <button
              className={`btn-checkout ${paying ? "btn-paying" : ""}`}
              onClick={onCheckout}
              disabled={paying}
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
