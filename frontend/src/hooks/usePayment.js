import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Dynamically load Razorpay checkout script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function usePayment() {
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); 
  const [error, setError] = useState(null);

  const initiatePayment = async ({ amount, cart, onSuccess }) => {
    setError(null);
    setPaying(true);

    try {
      // ── Step 1: Load Razorpay script ──────────────────────
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay. Check your internet connection.");
      }

      // ── Step 2: Create order on backend ───────────────────
      const orderRes = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.detail || "Failed to create order");
      }

      const { order_id, key_id } = await orderRes.json();

      
      await new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          amount: Math.round(amount * 100),   // paise
          currency: "INR",
          name: "ShopLite",
          description: `${cart.length} item(s)`,
          order_id,

          // Called when payment succeeds in the popup
          handler: async (response) => {
            try {
              // ── Step 4: Verify on backend ────────────────
              const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.detail || "Payment verification failed");
              }

              const result = await verifyRes.json();
              setPaymentResult(result);
              if (onSuccess) onSuccess(result);
              resolve(result);
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },

          // Called when user closes the popup without paying
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled by user"));
            },
          },

          // Pre-fill user details (optional)
          prefill: {
            name: "Customer",
          },

          theme: {
            color: "#a78bfa",   // matches ShopLite's violet accent
          },
        };

        const rzp = new window.Razorpay(options);

        // Called when payment fails inside the popup
        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error.description || "Payment failed"));
        });

        rzp.open();
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const resetPayment = () => {
    setPaymentResult(null);
    setError(null);
  };

  return { initiatePayment, paying, paymentResult, error, resetPayment };
}
