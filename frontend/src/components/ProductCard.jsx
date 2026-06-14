import { formatINR } from "../utils/format";

export function ProductCard({ product, onAddToCart, inCart }) {
  return (
    <div className="product-card">
      <div className="product-emoji">{product.image_emoji}</div>
      <div className="product-category">{product.category}</div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-desc">{product.description}</p>
      <div className="product-footer">
        <span className="product-price">{formatINR(product.price)}</span>
        <button
          className={`btn-add ${inCart ? "btn-added" : ""}`}
          onClick={() => onAddToCart(product)}
        >
          {inCart ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
