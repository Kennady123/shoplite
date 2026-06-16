import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../utils/format";
import styles from "../css/WishlistPage.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const WISHLIST_KEY = "shoplite_wishlist";

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function EmptyWishlist({ onBrowse }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>🤍</div>
      <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
      <p className={styles.emptyDesc}>Tap the heart on any product to save it here.</p>
      <button className={styles.browseBtn} onClick={onBrowse}>
        Browse Products
      </button>
    </div>
  );
}

export function WishlistPage({ onAddToCart, isInCart }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get saved IDs from localStorage
        const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
        const ids = saved.map((p) => (typeof p === "object" ? p.id : p));

        if (ids.length === 0) {
          setItems([]);
          return;
        }

        // Fetch fresh product data from API for each ID
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`${API_BASE}/products/${id}`)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          )
        );

        setItems(results.filter(Boolean));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const removeFromWishlist = (productId) => {
    setRemoving((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
        const updated = saved.filter((p) => {
          const id = typeof p === "object" ? p.id : p;
          return String(id) !== String(productId);
        });
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      setItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 250);
  };

  const handleShare = async (item) => {
    const url = `${window.location.origin}/product/${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.name, url });
        return;
      } catch {
        // user cancelled, fall through
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>← Back</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Wishlist</h1>
          {items.length > 0 && (
            <span className={styles.itemCount}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <span />
      </header>

      {loading && (
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <p>Loading wishlist…</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.stateBox}>
          <p className={styles.errorText}>Could not load wishlist.</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyWishlist onBrowse={() => navigate("/")} />
      )}

      {!loading && !error && items.length > 0 && (
        <div className={styles.grid}>
          {items.map((item) => {
            const inCart = isInCart?.(item.id);
            const isRemoving = removing.has(item.id);

            return (
              <div
                key={item.id}
                className={`${styles.card} ${isRemoving ? styles.cardRemoving : ""}`}
              >
                <div
                  className={styles.imageWrap}
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <div className={styles.iconGroup}>
                    <button
                      className={`${styles.heartBtn} ${styles.heartActive}`}
                      onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.id); }}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      disabled={isRemoving}
                    >
                      <HeartIcon filled={true} />
                    </button>
                    <button
                      className={styles.shareBtn}
                      onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                      aria-label="Share product"
                      title="Share product"
                    >
                      <ShareIcon />
                    </button>
                  </div>

                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className={styles.image} />
                  ) : (
                    <span className={styles.emoji}>{item.image_emoji || "📦"}</span>
                  )}

                  {copiedId === item.id && (
                    <div className={styles.toast}>Link copied</div>
                  )}
                </div>

                <div className={styles.info}>
                  <span className={styles.category}>{item.category}</span>
                  <h3
                    className={styles.name}
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {item.name}
                  </h3>

                  {item.quantity !== undefined && (
                    <span className={item.quantity === 0 ? styles.stockOut : styles.stockIn}>
                      {item.quantity === 0
                        ? "Out of stock"
                        : item.quantity <= 5
                        ? `Only ${item.quantity} left`
                        : "In stock"}
                    </span>
                  )}

                  <div className={styles.priceRow}>
                    <span className={styles.price}>{formatINR(item.price * 1.18)}</span>
                    <span className={styles.gstNote}>incl. GST</span>
                  </div>

                  <button
                    className={`${styles.addBtn} ${inCart ? styles.added : ""}`}
                    onClick={() => onAddToCart(item)}
                    disabled={item.quantity === 0}
                  >
                    {inCart
                      ? "✓ In Cart"
                      : item.quantity === 0
                      ? "Unavailable"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}