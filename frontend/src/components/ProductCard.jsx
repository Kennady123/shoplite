import { formatINR } from "../utils/format";
import styles from "../css/ProductCard.module.css";

export function ProductCard({ product, onAddToCart, inCart }) {
  const outOfStock = product.quantity === 0;

  return (
    <div className={styles.card}>
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className={styles.image}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={styles.emoji}
        style={{ display: product.image_url ? "none" : "flex" }}
      >
        {product.image_emoji || "📦"}
      </div>

      <div className={styles.category}>{product.category}</div>
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.desc}>{product.description}</p>

      {product.quantity !== undefined && (
        <p className={`${styles.stock} ${outOfStock ? styles.stockOut : styles.stockIn}`}>
          {outOfStock
            ? "Out of stock"
            : product.quantity <= 5
            ? `Only ${product.quantity} left`
            : "In stock"}
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.price}>{formatINR(product.price)}</span>
        <button
          className={`${styles.btnAdd} ${inCart ? styles.btnAdded : ""}`}
          onClick={() => onAddToCart(product)}
          disabled={outOfStock}
        >
          {inCart ? "✓ Added" : outOfStock ? "Unavailable" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}