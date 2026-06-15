import React, { useEffect, useState, useCallback } from "react";
import s from "../css/AdminDashboard.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`
});

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const formatDate = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
};

// ── Single seller card ────────────────────────────────────────
const SellerCard = ({ seller, activeTab, onUpdateStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(seller.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor =
    seller.status === "approved" ? "#4ade80" :
    seller.status === "rejected" ? "#f87171" : "#facc15";

  return (
    <div className={`${s.listItem} ${s["status_" + seller.status]}`}>

      {/* ── Card header — always visible ── */}
      <div className={s.cardHeader} onClick={() => setExpanded(!expanded)}>
        <div className={s.avatarWrap}>
          <div className={s.avatar}>{getInitials(seller.name)}</div>
        </div>
        <div className={s.cardMeta}>
          <div className={s.cardNameRow}>
            <span className={s.cardName}>{seller.name}</span>
            <span className={s.statusPill} style={{ background: `${statusColor}18`, color: statusColor, borderColor: `${statusColor}44` }}>
              {seller.status}
            </span>
          </div>
          <div className={s.cardSubRow}>
            <span className={s.cardBusiness}>🏢 {seller.business_name}</span>
            <span className={s.cardCategory}>{seller.business_category}</span>
          </div>
        </div>
        <button className={s.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className={s.cardBody}>
          <div className={s.detailGrid}>
            <div className={s.detailItem}>
              <span className={s.detailLabel}>Email</span>
              <div className={s.detailValueRow}>
                <span className={s.detailValue}>{seller.email}</span>
                <button className={s.copyBtn} onClick={copyEmail}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className={s.detailItem}>
              <span className={s.detailLabel}>Phone</span>
              <span className={s.detailValue}>{seller.phone}</span>
            </div>
            <div className={s.detailItem}>
              <span className={s.detailLabel}>Business number</span>
              <span className={s.detailValue}>{seller.business_number}</span>
            </div>
            <div className={s.detailItem}>
              <span className={s.detailLabel}>Joined</span>
              <span className={s.detailValue}>{formatDate(seller.created_at)}</span>
            </div>
            <div className={s.detailItem} style={{ gridColumn: "1 / -1" }}>
              <span className={s.detailLabel}>Address</span>
              <span className={s.detailValue}>{seller.business_address}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={s.actions}>
            {activeTab === "pending" && (
              <>
                <button className={s.btnApprove} onClick={() => onUpdateStatus(seller.id, "approved")}>
                  ✅ Approve
                </button>
                <button className={s.btnReject} onClick={() => onUpdateStatus(seller.id, "rejected")}>
                  ❌ Reject
                </button>
              </>
            )}
            {activeTab === "approved" && (
              <button className={s.btnReject} onClick={() => onUpdateStatus(seller.id, "rejected")}>
                🚫 Suspend
              </button>
            )}
            {activeTab === "rejected" && (
              <button className={s.btnApprove} onClick={() => onUpdateStatus(seller.id, "approved")}>
                ♻️ Re-Approve
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
export const AdminDashboard = ({ onClose, onSessionExpired }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [sellers, setSellers] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // ── Verify token — on every mount/refresh ──
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        onSessionExpired();
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/verify-token`, { headers: getHeaders() });
        if (!res.ok) {
          localStorage.removeItem("admin_token");
          onSessionExpired();
          return;
        }
        const data = await res.json();
        setAdminEmail(data.email || "Admin");
        setTokenChecked(true);
      } catch {
        localStorage.removeItem("admin_token");
        onSessionExpired();
      }
    };
    verifyToken();
  }, []);

  // ── Auto re-check token every 60 seconds ──
  useEffect(() => {
    if (!tokenChecked) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/admin/verify-token`, { headers: getHeaders() }).catch(() => null);
      if (!res || !res.ok) {
        localStorage.removeItem("admin_token");
        onSessionExpired();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [tokenChecked]);

  // ── Fetch sellers ──
  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/admin/sellers?status=${activeTab}`, { headers: getHeaders() });
      if (res.status === 401) { localStorage.removeItem("admin_token"); onSessionExpired(); return; }
      if (!res.ok) throw new Error();
      setSellers(await res.json());
    } catch {
      setError("Failed to load sellers.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // ── Fetch counts ──
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/sellers/counts`, { headers: getHeaders() });
      if (res.ok) setCounts(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (tokenChecked) { fetchSellers(); fetchCounts(); }
  }, [activeTab, tokenChecked]);

  const updateSellerStatus = async (id, status) => {
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/admin/sellers/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.status === 401) { localStorage.removeItem("admin_token"); onSessionExpired(); return; }
      if (!res.ok) throw new Error();
      setSuccess(`Seller marked as ${status}.`);
      fetchSellers();
      fetchCounts();
    } catch {
      setError("Failed to update seller status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    onSessionExpired();
  };

  // ── Filter sellers by search ──
  const filtered = sellers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.business_name?.toLowerCase().includes(q)
    );
  });

  // ── Session verifying screen ──
  if (!tokenChecked) {
    return (
      <div className={s.overlay}>
        <div className={s.verifyBox}>
          <div className={s.spinner} />
          <p className={s.verifyText}>Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.overlay}>
      <div className={s.dashboard}>

        {/* ── Header ── */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.headerIcon}>🏪</div>
            <div>
              <p className={s.headerTitle}>Seller Management</p>
              <p className={s.headerSub}>{adminEmail}</p>
            </div>
          </div>
          <div className={s.headerRight}>
            <button className={s.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
            <button className={s.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className={s.statsBar}>
          <div className={s.statItem}>
            <span className={s.statNum} style={{ color: "#facc15" }}>{counts.pending}</span>
            <span className={s.statLabel}>Pending</span>
          </div>
          <div className={s.statDivider} />
          <div className={s.statItem}>
            <span className={s.statNum} style={{ color: "#4ade80" }}>{counts.approved}</span>
            <span className={s.statLabel}>Approved</span>
          </div>
          <div className={s.statDivider} />
          <div className={s.statItem}>
            <span className={s.statNum} style={{ color: "#f87171" }}>{counts.rejected}</span>
            <span className={s.statLabel}>Rejected</span>
          </div>
          <div className={s.statDivider} />
          <div className={s.statItem}>
            <span className={s.statNum} style={{ color: "#a78bfa" }}>
              {counts.pending + counts.approved + counts.rejected}
            </span>
            <span className={s.statLabel}>Total</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={s.tabs}>
          {[
            { key: "pending",  label: "Pending",  emoji: "🕐" },
            { key: "approved", label: "Approved", emoji: "✅" },
            { key: "rejected", label: "Rejected", emoji: "🚫" },
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              className={`${s.tabBtn} ${activeTab === key ? s.activeTab : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {emoji} {label}
              <span className={`${s.tabCount} ${activeTab === key ? s.tabCountActive : ""}`}>
                {counts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className={s.searchWrap}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.searchInput}
            type="text"
            placeholder="Search by name, email or business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={s.searchClear} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* ── Messages ── */}
        {error   && <p className={s.error}>{error}</p>}
        {success && <p className={s.success}>{success}</p>}

        {/* ── List ── */}
        <div className={s.tabContent}>
          {loading ? (
            <>
              <div className={s.skeleton} />
              <div className={s.skeleton} style={{ opacity: 0.6 }} />
              <div className={s.skeleton} style={{ opacity: 0.35 }} />
            </>
          ) : filtered.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>📭</div>
              <p className={s.emptyTitle}>
                {search ? `No results for "${search}"` : `No ${activeTab} sellers`}
              </p>
              <p className={s.emptySub}>
                {search ? "Try a different search term" : "Nothing here yet"}
              </p>
            </div>
          ) : (
            filtered.map((seller) => (
              <SellerCard
                key={seller.id}
                seller={seller}
                activeTab={activeTab}
                onUpdateStatus={updateSellerStatus}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
};


