import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function AdminDashboard({
  onClose,
  onProductAdded,
}) {
  const [name, setName] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [category,
    setCategory] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [emoji, setEmoji] =
    useState("📱");

  const [loading, setLoading] =
    useState(false);

  const handleAddProduct =
    async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "admin_token"
          );

        const res = await fetch(
          `${API_BASE}/admin/products`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              name,
              price:
                Number(price),
              category,
              description,
              image_emoji:
                emoji,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to add product"
          );
        }

        alert(
          "Product Added Successfully"
        );

        setName("");
        setPrice("");
        setCategory("");
        setDescription("");
        setEmoji("📱");

        if (onProductAdded) {
          onProductAdded();
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="admin-overlay">
      <div className="dashboard-modal">

        <div className="dashboard-header">
          <h2>
            Admin Dashboard
          </h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <input
          className="admin-input"
          placeholder="Product Name"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <input
          className="admin-input"
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) =>
            setPrice(
              e.target.value
            )
          }
        />

        <input
          className="admin-input"
          placeholder="Category"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
        />

        <textarea
          className="admin-textarea"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          className="admin-input"
          placeholder="Emoji"
          value={emoji}
          onChange={(e) =>
            setEmoji(
              e.target.value
            )
          }
        />

        <button
          className="btn-primary full-width"
          onClick={
            handleAddProduct
          }
          disabled={loading}
        >
          {loading
            ? "Adding..."
            : "Add Product"}
        </button>

      </div>
    </div>
  );
}