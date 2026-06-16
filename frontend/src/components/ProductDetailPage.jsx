import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { formatINR } from "../utils/format";
import styles from "../css/ProductDetailPage.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const WISHLIST_KEY = "shoplite_wishlist";

function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ProductDetailPage({ onAddToCart, isInCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
      setWishlisted(saved.some((p) => String(p.id) === String(id)));
    } catch {
      setWishlisted(false);
    }
  }, [id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") navigate(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const toggleWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
      const exists = saved.some((p) => String(p.id) === String(id));
      const updated = exists
        ? saved.filter((p) => String(p.id) !== String(id))
        : [...saved, product];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      setWishlisted(!wishlisted);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    // 1. Native share (mobile/supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
        return;
      } catch {
        // user cancelled, fall through
      }
    }

    // 2. Clipboard copy (desktop)
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // clipboard unavailable
    }

    // 3. Final fallback — always works
    window.prompt("Copy this link:", url);
  };

  const closePopup = () => navigate(-1);
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closePopup(); };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.card} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={closePopup} aria-label="Close">
          <CloseIcon />
        </button>

        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading product…</p>
          </div>
        )}

        {!loading && (error || !product) && (
          <div className={styles.stateBox}>
            <p>Could not load product.</p>
            {error && <code>{error}</code>}
            <button className={styles.btnOutline} onClick={closePopup}>Close</button>
          </div>
        )}

        {!loading && product && (
          <div className={styles.content}>
            <div className={styles.imageWrap}>
              <div className={styles.iconGroup}>
                <button
                  className={`${styles.iconBtn} ${wishlisted ? styles.heartActive : ""}`}
                  onClick={toggleWishlist}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <HeartIcon filled={wishlisted} />
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={handleShare}
                  aria-label="Share this product"
                  title="Share this product"
                >
                  <ShareIcon />
                </button>
              </div>

              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className={styles.image} />
              ) : (
                <span className={styles.emoji}>{product.image_emoji || "📦"}</span>
              )}

              {copied && <div className={styles.toast}>Link copied ✓</div>}
            </div>

            <div className={styles.info}>
              <div className={styles.category}>{product.category}</div>
              <h2 className={styles.name}>{product.name}</h2>

              {product.quantity !== undefined && (
                <p className={product.quantity === 0 ? styles.stockOut : styles.stockIn}>
                  {product.quantity === 0
                    ? "Out of stock"
                    : product.quantity <= 5
                    ? `Only ${product.quantity} left`
                    : "In stock"}
                </p>
              )}

              <div className={styles.priceRow}>
                <span className={styles.price}>{formatINR(product.price * 1.18)}</span>
                <span className={styles.gstNote}>incl. GST</span>
              </div>

              <p className={styles.desc}>{product.description}</p>

              <table className={styles.specs}>
                <tbody>
                  <tr>
                    <td>Category</td>
                    <td>{product.category}</td>
                  </tr>
                  <tr>
                    <td>Price (excl. GST)</td>
                    <td>{formatINR(product.price)}</td>
                  </tr>
                  <tr>
                    <td>Availability</td>
                    <td>{product.quantity === 0 ? "Out of stock" : `${product.quantity} in stock`}</td>
                  </tr>
                </tbody>
              </table>

              <button
                className={`${styles.addBtn} ${isInCart?.(product.id) ? styles.added : ""}`}
                onClick={() => onAddToCart(product)}
                disabled={product.quantity === 0}
              >
                {isInCart?.(product.id)
                  ? "✓ Added to cart"
                  : product.quantity === 0
                  ? "Unavailable"
                  : "Add to Cart"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}