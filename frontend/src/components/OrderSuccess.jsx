export function OrderSuccess({ paymentId, orderId, onContinue }) {
  return (
    <div className="success-overlay">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-sub">Your order has been confirmed.</p>

        <div className="success-details">
          <div className="success-row">
            <span className="success-label">Payment ID</span>
            <span className="success-value">{paymentId}</span>
          </div>
          <div className="success-row">
            <span className="success-label">Order ID</span>
            <span className="success-value">{orderId}</span>
          </div>
        </div>

        <button className="btn-continue" onClick={onContinue}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
