import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import s from "../css/SellerDashboard.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const emptyForm = {
  name: "", price: "", category: "",
  description: "", image_emoji: "📱",
  image_url: "", quantity: "",
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller]     = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const getToken = () => localStorage.getItem("seller-token");

  // ── Fetch seller profile ──────────────────────────────
  useEffect(() => {
    const t = getToken();
    if (!t) { navigate("/"); return; }

    const fetchSeller = async () => {
      try {
        const res = await fetch(`${API_BASE}/seller/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`
          }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSeller(data);
        localStorage.setItem("seller", JSON.stringify(data));
      } catch {
        localStorage.removeItem("seller-token");
        localStorage.removeItem("seller");
        navigate("/");
      }
    };
    fetchSeller();
  }, [navigate]);

  // ── Fetch seller's products ───────────────────────────
  const fetchProducts = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/seller/products`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
      });
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError("Failed to load products.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (seller?.status === "approved") fetchProducts();
  }, [seller, fetchProducts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Add / Edit ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    const method = editId ? "PUT" : "POST";
    const url    = editId
      ? `${API_BASE}/seller/products/${editId}`
      : `${API_BASE}/seller/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name:        form.name,
          price:       Number(form.price),
          category:    form.category,
          description: form.description,
          image_emoji: form.image_emoji || null,
          image_url:   form.image_url   || null,
          quantity:    parseInt(form.quantity) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save product");
      }

      setSuccess(editId ? "Product updated!" : "Product added!");
      setForm(emptyForm);
      setEditId(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id) => {
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/seller/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error();
      setSuccess("Product deleted!");
      setDeleteId(null);
      fetchProducts();
    } catch {
      setError("Failed to delete product.");
    }
  };

  // ── Edit click ────────────────────────────────────────
  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      name:        p.name,
      price:       p.price,
      category:    p.category,
      description: p.description,
      image_emoji: p.image_emoji || "📱",
      image_url:   p.image_url   || "",
      quantity:    p.quantity,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => { setEditId(null); setForm(emptyForm); };

  const handleLogout = () => {
    localStorage.removeItem("seller-token");
    localStorage.removeItem("seller");
    navigate("/");
  };

  // ── Avatar initials helper ────────────────────────────
  const getInitials = (name = "") =>
    name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (!seller) return (
    <div className={s.loadingScreen}>
      <div className={s.spinner} />
      <p>Loading your dashboard…</p>
    </div>
  );

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>🏪</div>
          <div>
            <p className={s.headerTitle}>{seller.business_name}</p>
            <p className={s.headerSub}>{seller.email}</p>
          </div>
        </div>
        <div className={s.headerRight}>
          <div className={s.statusPill} style={{
            color:       seller.status === "approved" ? "#4ade80" : seller.status === "pending" ? "#facc15" : "#f87171",
            background:  seller.status === "approved" ? "#4ade8018" : seller.status === "pending" ? "#facc1518" : "#f8717118",
            borderColor: seller.status === "approved" ? "#4ade8044" : seller.status === "pending" ? "#facc1544" : "#f8717144",
          }}>
            {seller.status === "approved" ? "✅" : seller.status === "pending" ? "⏳" : "🚫"} {seller.status}
          </div>
          <button className={s.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </header>

      {/* ── Not approved ── */}
      {seller.status !== "approved" ? (
        <div className={s.pendingBox}>
          <div className={s.pendingIcon}>⏳</div>
          <h2 className={s.pendingTitle}>Waiting for Admin Approval</h2>
          <p className={s.pendingSub}>You cannot add or manage products until admin approves your account.</p>
        </div>

      ) : (
        <div className={s.content}>

          {error   && <p className={s.error}>{error}</p>}
          {success && <p className={s.success}>{success}</p>}

          {/* ── Seller Info Card ── */}
          <div className={s.sellerInfoCard}>

            {/* Top: avatar + name */}
            <div className={s.sellerInfoTop}>
              <div className={s.sellerAvatar}>{getInitials(seller.business_name)}</div>
              <div>
                <p className={s.sellerBizName}>{seller.business_name}</p>
                <p className={s.sellerEmail}>{seller.email}</p>
              </div>
            </div>

            {/* Total products row */}
            <div className={s.sellerProductRow}>
              <span className={s.sellerProductLabel}>📦 Total products</span>
              <span className={s.sellerCountVal}>{products.length}</span>
            </div>

            {/* Detail rows */}
            <div className={s.sellerInfoRows}>

              {seller.owner_name && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>👤</div>
                  <div>
                    <p className={s.sellerInfoLabel}>Owner name</p>
                    <p className={s.sellerInfoVal}>{seller.owner_name}</p>
                  </div>
                </div>
              )}

              {seller.phone && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>📞</div>
                  <div>
                    <p className={s.sellerInfoLabel}>Phone</p>
                    <p className={s.sellerInfoVal}>{seller.phone}</p>
                  </div>
                </div>
              )}

              {seller.location && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>📍</div>
                  <div>
                    <p className={s.sellerInfoLabel}>Location</p>
                    <p className={s.sellerInfoVal}>{seller.location}</p>
                  </div>
                </div>
              )}

              {seller.gstin && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>🏦</div>
                  <div>
                    <p className={s.sellerInfoLabel}>GSTIN</p>
                    <p className={s.sellerInfoValPurple}>{seller.gstin}</p>
                  </div>
                </div>
              )}

              {seller.joined_at && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>📅</div>
                  <div>
                    <p className={s.sellerInfoLabel}>Member since</p>
                    <p className={s.sellerInfoVal}>
                      {new Date(seller.joined_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}

              {seller.categories && seller.categories.length > 0 && (
                <div className={s.sellerInfoRow}>
                  <div className={s.sellerInfoIcon}>📦</div>
                  <div>
                    <p className={s.sellerInfoLabel}>Categories sold</p>
                    <div className={s.sellerTagRow}>
                      {seller.categories.map((c) => (
                        <span key={c} className={s.sellerTag}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={s.sellerInfoRow}>
                <div className={s.sellerInfoIcon}>✅</div>
                <div>
                  <p className={s.sellerInfoLabel}>Account status</p>
                  <p className={s.sellerInfoValGreen}>Active · Verified seller</p>
                </div>
              </div>

            </div>
          </div>

          {/* ── Form ── */}
          <div className={s.formCard}>
            <h3 className={s.formTitle}>
              {editId ? "✏️ Edit Product" : "➕ Add New Product"}
            </h3>

            <form className={s.form} onSubmit={handleSubmit}>
              <div className={s.formGrid}>

                <div className={s.field}>
                  <label className={s.label}>Product Name</label>
                  <input className={s.input} name="name"
                    placeholder="e.g. iPhone 15 Pro"
                    value={form.name} onChange={handleChange} required />
                </div>

                <div className={s.field}>
                  <label className={s.label}>Price (₹)</label>
                  <input className={s.input} name="price" type="number"
                    placeholder="e.g. 129999"
                    value={form.price} onChange={handleChange} required />
                </div>

                <div className={s.field}>
                  <label className={s.label}>Category</label>
                  <input className={s.input} name="category"
                    placeholder="e.g. Mobiles"
                    value={form.category} onChange={handleChange} required />
                </div>

                <div className={s.field}>
                  <label className={s.label}>Quantity / Stock</label>
                  <input className={s.input} name="quantity" type="number"
                    placeholder="e.g. 50"
                    value={form.quantity} onChange={handleChange} />
                </div>

                <div className={s.field}>
                  <label className={s.label}>Emoji</label>
                  <input className={s.input} name="image_emoji"
                    placeholder="📱"
                    value={form.image_emoji} onChange={handleChange} />
                </div>

                <div className={s.field}>
                  <label className={s.label}>Image URL (optional)</label>
                  <input className={s.input} name="image_url"
                    placeholder="https://..."
                    value={form.image_url} onChange={handleChange} />
                </div>

                <div className={s.field} style={{ gridColumn: "1 / -1" }}>
                  <label className={s.label}>Description</label>
                  <textarea className={s.textarea} name="description"
                    placeholder="Describe your product..."
                    value={form.description} onChange={handleChange} required />
                </div>

              </div>

              <div className={s.formActions}>
                {editId && (
                  <button type="button" className={s.cancelBtn} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
                <button type="submit" className={s.submitBtn} disabled={loading}>
                  {loading ? "Saving..." : editId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Product List ── */}
          <div className={s.listSection}>
            <div className={s.listHeader}>
              <h3 className={s.listTitle}>My Products</h3>
              <span className={s.listCount}>{products.length} products</span>
            </div>

            {fetching ? (
              <div className={s.skeletonWrap}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={s.skeleton} style={{ opacity: 1 - i * 0.25 }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={s.emptyState}>
                <div className={s.emptyIcon}>📦</div>
                <p className={s.emptyTitle}>No products yet</p>
                <p className={s.emptySub}>Add your first product using the form above</p>
              </div>
            ) : (
              <div className={s.productGrid}>
                {products.map((p) => (
                  <div key={p.id} className={`${s.productCard} ${editId === p.id ? s.productCardActive : ""}`}>

                    <div className={s.productThumb}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className={s.productImg} />
                        : <span className={s.productEmoji}>{p.image_emoji || "📦"}</span>
                      }
                    </div>

                    <div className={s.productInfo}>
                      <span className={s.productCategory}>{p.category}</span>
                      <p className={s.productName}>{p.name}</p>
                      <p className={s.productDesc}>{p.description}</p>
                      <div className={s.productMeta}>
                        <span className={s.productPrice}>₹{p.price.toLocaleString("en-IN")}</span>
                        <span className={`${s.productStock} ${p.quantity > 0 ? s.stockIn : s.stockOut}`}>
                          {p.quantity > 0 ? `${p.quantity} in stock` : "Out of stock"}
                        </span>
                      </div>
                    </div>

                    <div className={s.productActions}>
                      <button className={s.editBtn} onClick={() => handleEdit(p)}>✏️ Edit</button>
                      {deleteId === p.id ? (
                        <div className={s.confirmDelete}>
                          <span>Sure?</span>
                          <button className={s.confirmYes} onClick={() => handleDelete(p.id)}>Yes</button>
                          <button className={s.confirmNo}  onClick={() => setDeleteId(null)}>No</button>
                        </div>
                      ) : (
                        <button className={s.deleteBtn} onClick={() => setDeleteId(p.id)}>🗑️ Delete</button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default SellerDashboard;