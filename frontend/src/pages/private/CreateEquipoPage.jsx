import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";

function getTeamInitials(name) {
  if (!name) return "EQ";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

export default function CreateEquipoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    nombre_equipo: "",
    descripcion: "",
    activo: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/equipos/", form);
      setSuccess("Equipo creado correctamente.");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("ERROR CREANDO EQUIPO:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible crear el equipo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryMouseEnter = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            <aside style={styles.sidebar}>
              <div style={styles.sidebarProfile}>
                <div style={styles.avatarWrap}>
                  <img
                    src={user?.foto_perfil || "/images/logo-balon.png"}
                    alt={user?.nombres || "Usuario"}
                    style={styles.avatar}
                    onError={(e) => {
                      e.currentTarget.src = "/images/logo-balon.png";
                    }}
                  />
                </div>

                <div style={styles.profileInfo}>
                  <h3 style={styles.profileName}>
                    {user?.nombres} {user?.apellidos}
                  </h3>
                  <p style={styles.profileSub}>ID: {user?.id || "--"}</p>
                  <p style={styles.profileSub}>{user?.email || "Jugador"}</p>
                </div>
              </div>

              <nav style={styles.sidebarNav}>
                <Link to="/dashboard" style={styles.navItem}>
                  <span style={styles.navIcon}>👤</span>
                  <span>Mi panel</span>
                </Link>

                <Link to="/perfil" style={styles.navItem}>
                  <span style={styles.navIcon}>🪪</span>
                  <span>Mi perfil</span>
                </Link>

                <Link to="/reservas" style={styles.navItem}>
                  <span style={styles.navIcon}>📅</span>
                  <span>Mis reservas</span>
                </Link>

                <Link to="/partidos/mis-partidos" style={styles.navItem}>
                  <span style={styles.navIcon}>⚽</span>
                  <span>Mis partidos</span>
                </Link>

                <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                  <span style={styles.navIcon}>👥</span>
                  <span>Mis equipos</span>
                </div>
              </nav>
            </aside>

            <section style={styles.content}>
              <div style={styles.header}>
                <h1 style={styles.title}>👥 Crear equipo</h1>
                <p style={styles.subtitle}>
                  Registra un nuevo equipo para organizar partidos con tus compañeros.
                </p>
              </div>

              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              <div style={styles.mainGrid}>
                <section style={styles.formCard}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Información del equipo</h2>
                  </div>

                  <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                      <label style={styles.label}>Nombre del equipo</label>
                      <input
                        type="text"
                        name="nombre_equipo"
                        value={form.nombre_equipo}
                        onChange={handleChange}
                        placeholder="Ej: Los Cracks FC"
                        style={styles.input}
                        required
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Descripción</label>
                      <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        placeholder="Describe tu equipo"
                        style={styles.textarea}
                      />
                    </div>

                    <label style={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                      />
                      <span>Equipo activo</span>
                    </label>

                    <button
                      type="submit"
                      style={{
                        ...styles.primaryButton,
                        opacity: loading ? 0.85 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                      disabled={loading}
                      onMouseEnter={handlePrimaryMouseEnter}
                      onMouseLeave={handlePrimaryMouseLeave}
                    >
                      {loading ? "Creando..." : "Crear equipo"}
                    </button>
                  </form>
                </section>

                <aside style={styles.previewCard}>
                  <div style={styles.sectionHeaderSmall}>
                    <h2 style={styles.sectionTitle}>Vista previa</h2>
                  </div>

                  <div style={styles.previewIdentity}>
                    <div style={styles.previewAvatar}>
                      {getTeamInitials(form.nombre_equipo)}
                    </div>

                    <div style={styles.previewInfo}>
                      <h3 style={styles.previewName}>
                        {form.nombre_equipo || "Nombre del equipo"}
                      </h3>
                      <p style={styles.previewDescription}>
                        {form.descripcion || "Aquí verás una breve descripción del equipo."}
                      </p>
                    </div>
                  </div>

                  <div style={styles.previewMetaGrid}>
                    <div style={styles.metaCard}>
                      <span style={styles.metaLabel}>Estado</span>
                      <span style={styles.metaValue}>
                        {form.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div style={styles.metaCard}>
                      <span style={styles.metaLabel}>Miembros iniciales</span>
                      <span style={styles.metaValue}>1</span>
                    </div>
                  </div>

                  <div style={styles.badgeWrap}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: form.activo ? GREEN : SLATE,
                      }}
                    >
                      {form.activo ? "Listo para jugar" : "Inactivo"}
                    </span>
                  </div>
                </aside>
              </div>

              <div style={styles.bottomGlow} />
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 48px)",
    background: `url('${PAGE_BG}') center/cover no-repeat`,
    overflow: "hidden",
  },

  overlay: {
    minHeight: "calc(100vh - 48px)",
    padding: "18px 20px 18px",
    background: "linear-gradient(rgba(3,10,24,0.25), rgba(3,10,24,0.34))",
    overflow: "hidden",
  },

  wrapper: {
    width: "100%",
    maxWidth: "1360px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "270px 1fr",
    gap: "18px",
    alignItems: "start",
    minHeight: "calc(100vh - 84px)",
  },

  sidebar: {
    background: "rgba(9,19,34,0.72)",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.20)",
    backdropFilter: "blur(5px)",
    overflow: "hidden",
    height: "fit-content",
  },

  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  avatarWrap: {
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.22)",
    flexShrink: 0,
    background: "#0f172a",
  },

  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  profileInfo: {
    minWidth: 0,
  },

  profileName: {
    margin: "0 0 4px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1.15,
  },

  profileSub: {
    margin: "2px 0 0",
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },

  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 0",
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    color: "#f8fafc",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 700,
    borderLeft: "3px solid transparent",
  },

  navItemActive: {
    background: "rgba(0,0,0,0.20)",
    borderLeft: "3px solid #22c55e",
  },

  navIcon: {
    width: "20px",
    textAlign: "center",
    fontSize: "16px",
  },

  content: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  header: {
    marginBottom: "14px",
  },

  title: {
    margin: "0 0 4px",
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: 900,
    textShadow: "0 4px 14px rgba(0,0,0,0.30)",
  },

  subtitle: {
    margin: 0,
    color: "#e2e8f0",
    fontSize: "15px",
    fontWeight: 500,
    textShadow: "0 4px 14px rgba(0,0,0,0.30)",
  },

  error: {
    color: "#fecaca",
    marginBottom: "12px",
    fontWeight: 700,
  },

  success: {
    color: "#bbf7d0",
    marginBottom: "12px",
    fontWeight: 700,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: "16px",
    alignItems: "stretch",
  },

  formCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  previewCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  sectionHeader: {
    marginBottom: "14px",
  },

  sectionHeaderSmall: {
    marginBottom: "14px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#1e293b",
  },

  input: {
    width: "100%",
    padding: "13px 15px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    maxHeight: "110px",
    padding: "13px 15px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    resize: "none",
    boxSizing: "border-box",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(22,138,44,0.18)",
    marginTop: "2px",
  },

  previewIdentity: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "14px",
  },

  previewAvatar: {
    width: "62px",
    height: "62px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "20px",
    flexShrink: 0,
  },

  previewInfo: {
    minWidth: 0,
  },

  previewName: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1.15,
    wordBreak: "break-word",
  },

  previewDescription: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  previewMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginBottom: "14px",
  },

  metaCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  metaLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  metaValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    wordBreak: "break-word",
  },

  badgeWrap: {
    display: "flex",
  },

  statusBadge: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
  },

  bottomGlow: {
    marginTop: "14px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "220px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};