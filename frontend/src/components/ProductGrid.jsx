import { useState, useMemo } from "react";
import { ProductCard } from "./ProductCard";

const PRICE_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under ₹1,000", min: 0, max: 999 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹15,000", min: 5001, max: 15000 },
  { label: "Above ₹15,000", min: 15001, max: Infinity },
];

export function ProductGrid({ products, loading, error, onAddToCart, isInCart }) {
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState(0);

  const filtered = useMemo(() => {
    const { min, max } = PRICE_RANGES[priceRange];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        p.price >= min &&
        p.price <= max
    );
  }, [products, search, priceRange]);

  return (
    <section className="product-section">
      <div className="section-header">
        <h2 className="section-title">Products <span className="badge">{filtered.length}</span></h2>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <select
          className="price-filter"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
        >
          {PRICE_RANGES.map((r, i) => (
            <option key={i} value={i}>{r.label}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading products…</p>
        </div>
      )}

      {error && (
        <div className="state-box error-box">
          <span className="state-icon">⚠️</span>
          <p>Could not load products.</p>
          <p className="error-detail">Make sure the FastAPI server is running on port 8000.</p>
          <code>{error}</code>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-box">
          <span className="state-icon">🔍</span>
          <p>No products match your search.</p>
          <button className="btn-outline" onClick={() => { setSearch(""); setPriceRange(0); }}>
            Clear filters
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              inCart={isInCart(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
