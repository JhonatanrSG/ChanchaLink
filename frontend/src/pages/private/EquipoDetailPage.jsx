import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";

function formatEstadoEquipo(activo) {
  return activo ? "Activo" : "Inactivo";
}

function formatRol(rol) {
  if (!rol) return "Sin rol";
  if (rol === "capitan") return "Capitán";
  if (rol === "miembro") return "Miembro";
  if (rol === "suplente") return "Suplente";
  return rol.charAt(0).toUpperCase() + rol.slice(1);
}

function getTeamInitials(name) {
  if (!name) return "EQ";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function getUserInitials(name) {
  if (!name) return "U";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

export default function EquipoDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [equipo, setEquipo] = useState(null);
  const [usuarioId, setUsuarioId] = useState("");
  const [rolEquipo, setRolEquipo] = useState("miembro");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEquipo = async () => {
    try {
      const response = await api.get(`/equipos/${id}/`);
      setEquipo(response.data);
    } catch (err) {
      console.error("ERROR CARGANDO EQUIPO:", err);
      setError("No fue posible cargar el detalle del equipo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [id]);

  const handleAgregarMiembro = async (e) => {
    e.preventDefault();
    if (adding) return;

    setError("");
    setSuccess("");
    setAdding(true);

    try {
      await api.post(`/equipos/${id}/miembros/`, {
        usuario_id: Number(usuarioId),
        rol_equipo: rolEquipo,
      });

      setSuccess("Miembro agregado correctamente.");
      setUsuarioId("");
      setRolEquipo("miembro");
      await fetchEquipo();
    } catch (err) {
      console.error("ERROR AGREGANDO MIEMBRO:", err?.response?.data || err);

      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible agregar el miembro.");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleEliminarMiembro = async (miembroId) => {
    setError("");
    setSuccess("");

    try {
      await api.delete(`/equipos/${id}/miembros/${miembroId}/`);
      setSuccess("Miembro eliminado correctamente.");
      await fetchEquipo();
    } catch (err) {
      console.error("ERROR ELIMINANDO MIEMBRO:", err?.response?.data || err);

      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("No fue posible eliminar el miembro.");
      }
    }
  };

  const resumen = useMemo(() => {
    const miembros = equipo?.miembros || [];

    return {
      total: miembros.length,
      activos: miembros.filter((m) => m.activo).length,
      capitanes: miembros.filter((m) => m.rol_equipo === "capitan").length,
      suplentes: miembros.filter((m) => m.rol_equipo === "suplente").length,
    };
  }, [equipo]);

  const capitan = useMemo(() => {
    return equipo?.miembros?.find((m) => m.rol_equipo === "capitan") || null;
  }, [equipo]);

  const handlePrimaryMouseEnter = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = GREEN;
  };

  const handleDangerMouseEnter = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.opacity = "0.9";
  };

  const handleDangerMouseLeave = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.opacity = "1";
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando equipo...</p>
            ) : equipo ? (
              <>
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
                  <div style={styles.heroBlock}>
                    <h1 style={styles.title}>👥 Gestión del equipo</h1>
                    <p style={styles.subtitle}>
                      Administra la información del equipo y sus integrantes.
                    </p>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}

                  <section style={styles.teamHeroCard}>
                    <div style={styles.teamHeroIdentity}>
                      <div style={styles.teamHeroAvatar}>
                        {getTeamInitials(equipo.nombre_equipo)}
                      </div>

                      <div style={styles.teamHeroInfo}>
                        <h2 style={styles.teamHeroName}>{equipo.nombre_equipo}</h2>
                        <p style={styles.teamHeroDescription}>
                          {equipo.descripcion || "Sin descripción"}
                        </p>
                        <div style={styles.teamHeroBadges}>
                          <span
                            style={{
                              ...styles.heroBadge,
                              background: equipo.activo ? GREEN : SLATE,
                            }}
                          >
                            {formatEstadoEquipo(equipo.activo)}
                          </span>
                          <span style={{ ...styles.heroBadge, background: SLATE }}>
                            {equipo.miembros?.length || 0} miembros
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.teamHeroMeta}>
                      <div style={styles.metaCard}>
                        <span style={styles.metaLabel}>Creador</span>
                        <span style={styles.metaValue}>
                          {equipo.creador_email || "No disponible"}
                        </span>
                      </div>

                      <div style={styles.metaCard}>
                        <span style={styles.metaLabel}>Estado</span>
                        <span style={styles.metaValue}>
                          {formatEstadoEquipo(equipo.activo)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <div style={styles.topRow}>
                    <section style={styles.summaryCard}>
                      <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Resumen del equipo</h2>
                      </div>

                      <div style={styles.kpiGrid}>
                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Miembros</p>
                          <h3 style={styles.kpiValue}>{resumen.total}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Activos</p>
                          <h3 style={styles.kpiValue}>{resumen.activos}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Capitanes</p>
                          <h3 style={styles.kpiValue}>{resumen.capitanes}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Suplentes</p>
                          <h3 style={styles.kpiValue}>{resumen.suplentes}</h3>
                        </div>
                      </div>
                    </section>

                    <section style={styles.highlightCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Liderazgo</h2>
                      </div>

                      {capitan ? (
                        <>
                          <div style={styles.highlightIdentity}>
                            <div style={styles.highlightAvatar}>
                              {getUserInitials(capitan.usuario_nombre)}
                            </div>
                            <div style={styles.highlightInfo}>
                              <p style={styles.highlightName}>
                                {capitan.usuario_nombre}
                              </p>
                              <p style={styles.highlightLine}>
                                📧 {capitan.usuario_email}
                              </p>
                              <p style={styles.highlightLine}>
                                🏅 {formatRol(capitan.rol_equipo)}
                              </p>
                            </div>
                          </div>

                          <div style={styles.nextBadgeWrap}>
                            <span style={{ ...styles.sideStatus, background: GREEN }}>
                              Capitán
                            </span>
                          </div>
                        </>
                      ) : (
                        <p style={styles.emptyTextSmall}>
                          Este equipo aún no tiene capitán asignado.
                        </p>
                      )}
                    </section>
                  </div>

                  <div style={styles.managementGrid}>
                    <section style={styles.formSection}>
                      <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Agregar miembro</h2>
                      </div>

                      <form onSubmit={handleAgregarMiembro} style={styles.form}>
                        <div>
                          <label style={styles.label}>ID de usuario</label>
                          <input
                            type="number"
                            value={usuarioId}
                            onChange={(e) => setUsuarioId(e.target.value)}
                            style={styles.input}
                            placeholder="Ej: 5"
                            required
                          />
                        </div>

                        <div>
                          <label style={styles.label}>Rol en el equipo</label>
                          <select
                            value={rolEquipo}
                            onChange={(e) => setRolEquipo(e.target.value)}
                            style={styles.input}
                          >
                            <option value="miembro">Miembro</option>
                            <option value="capitan">Capitán</option>
                            <option value="suplente">Suplente</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          style={{
                            ...styles.primaryButton,
                            opacity: adding ? 0.85 : 1,
                            cursor: adding ? "not-allowed" : "pointer",
                          }}
                          disabled={adding}
                          onMouseEnter={handlePrimaryMouseEnter}
                          onMouseLeave={handlePrimaryMouseLeave}
                        >
                          {adding ? "Agregando..." : "Agregar miembro"}
                        </button>
                      </form>
                    </section>

                    <section style={styles.sideInfoCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Gestión rápida</h2>
                      </div>

                      <div style={styles.quickInfoList}>
                        <div style={styles.quickInfoItem}>
                          <span style={styles.quickInfoLabel}>Equipo</span>
                          <span style={styles.quickInfoValue}>
                            {equipo.nombre_equipo}
                          </span>
                        </div>

                        <div style={styles.quickInfoItem}>
                          <span style={styles.quickInfoLabel}>Estado</span>
                          <span style={styles.quickInfoValue}>
                            {formatEstadoEquipo(equipo.activo)}
                          </span>
                        </div>

                        <div style={styles.quickInfoItem}>
                          <span style={styles.quickInfoLabel}>Creador</span>
                          <span style={styles.quickInfoValue}>
                            {equipo.creador_email}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section style={styles.membersSection}>
                    <div style={styles.sectionHeader}>
                      <h2 style={styles.sectionTitle}>Miembros del equipo</h2>
                    </div>

                    {equipo.miembros?.length === 0 ? (
                      <p style={styles.emptyText}>No hay miembros registrados.</p>
                    ) : (
                      <div style={styles.membersGrid}>
                        {equipo.miembros.map((miembro) => (
                          <article key={miembro.id} style={styles.memberCard}>
                            <div style={styles.memberTopRow}>
                              <div style={styles.memberIdentity}>
                                <div style={styles.memberAvatar}>
                                  {getUserInitials(miembro.usuario_nombre)}
                                </div>

                                <div style={styles.memberInfo}>
                                  <h3 style={styles.memberName}>
                                    {miembro.usuario_nombre}
                                  </h3>
                                  <p style={styles.memberEmail}>
                                    {miembro.usuario_email}
                                  </p>
                                </div>
                              </div>

                              <span
                                style={{
                                  ...styles.estadoBadge,
                                  background:
                                    miembro.rol_equipo === "capitan"
                                      ? GREEN
                                      : SLATE,
                                }}
                              >
                                {formatRol(miembro.rol_equipo)}
                              </span>
                            </div>

                            <div style={styles.infoGrid}>
                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Rol</span>
                                <span style={styles.infoValue}>
                                  {formatRol(miembro.rol_equipo)}
                                </span>
                              </div>

                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Activo</span>
                                <span style={styles.infoValue}>
                                  {miembro.activo ? "Sí" : "No"}
                                </span>
                              </div>
                            </div>

                            {miembro.rol_equipo !== "capitan" && (
                              <div style={styles.actions}>
                                <button
                                  type="button"
                                  style={styles.deleteButton}
                                  onClick={() => handleEliminarMiembro(miembro.id)}
                                  onMouseEnter={handleDangerMouseEnter}
                                  onMouseLeave={handleDangerMouseLeave}
                                >
                                  Eliminar miembro
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <div style={styles.bottomGlow} />
                </section>
              </>
            ) : (
              <p style={styles.statusText}>No se encontró el equipo.</p>
            )}
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
    overflowX: "hidden",
  },

  overlay: {
    minHeight: "calc(100vh - 48px)",
    padding: "18px 20px 22px",
    background: "linear-gradient(rgba(3,10,24,0.25), rgba(3,10,24,0.34))",
  },

  wrapper: {
    width: "100%",
    maxWidth: "1360px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "270px 1fr",
    gap: "18px",
    alignItems: "start",
  },

  sidebar: {
    background: "rgba(9,19,34,0.72)",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.20)",
    backdropFilter: "blur(5px)",
    overflow: "hidden",
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
  },

  heroBlock: {
    marginBottom: "16px",
  },

  title: {
    margin: "0 0 4px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  subtitle: {
    margin: 0,
    color: "#e2e8f0",
    fontSize: "16px",
    fontWeight: 500,
    textShadow: "0 4px 14px rgba(0,0,0,0.30)",
  },

  error: {
    color: "#fecaca",
    marginBottom: "14px",
    fontWeight: 700,
  },

  success: {
    color: "#bbf7d0",
    marginBottom: "14px",
    fontWeight: 700,
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "16px",
    padding: "40px 0",
    gridColumn: "1 / -1",
  },

  teamHeroCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.9fr",
    gap: "16px",
    marginBottom: "16px",
  },

  teamHeroIdentity: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },

  teamHeroAvatar: {
    width: "78px",
    height: "78px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "24px",
    flexShrink: 0,
  },

  teamHeroInfo: {
    minWidth: 0,
  },

  teamHeroName: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "24px",
    fontWeight: 900,
    lineHeight: 1.15,
  },

  teamHeroDescription: {
    margin: "0 0 10px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.45,
  },

  teamHeroBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  heroBadge: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
  },

  teamHeroMeta: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
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

  topRow: {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.8fr",
    gap: "16px",
    alignItems: "stretch",
    marginBottom: "16px",
  },

  summaryCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  highlightCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  sectionHeaderSmall: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },

  kpiCard: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },

  kpiLabel: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },

  kpiValue: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
    fontWeight: 900,
  },

  highlightIdentity: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "10px",
  },

  highlightAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "16px",
    flexShrink: 0,
  },

  highlightInfo: {
    minWidth: 0,
  },

  highlightName: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 900,
    lineHeight: 1.2,
  },

  highlightLine: {
    margin: "0 0 7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },

  nextBadgeWrap: {
    display: "flex",
    marginTop: "10px",
  },

  managementGrid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: "16px",
    marginBottom: "16px",
  },

  formSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sideInfoCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  quickInfoList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  quickInfoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBottom: "10px",
    borderBottom: "1px solid #e2e8f0",
  },

  quickInfoLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  quickInfoValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    wordBreak: "break-word",
  },

  form: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "end",
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
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "14px 18px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(22,138,44,0.18)",
  },

  membersSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  emptyText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  memberCard: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: 0,
  },

  memberTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  memberIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
    flex: 1,
  },

  memberAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "16px",
    flexShrink: 0,
  },

  memberInfo: {
    minWidth: 0,
  },

  memberName: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.15,
    wordBreak: "break-word",
  },

  memberEmail: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 600,
    wordBreak: "break-word",
  },

  estadoBadge: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  infoBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },

  infoLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  infoValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 800,
    wordBreak: "break-word",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  deleteButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 14px",
    background: RED,
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    width: "100%",
  },

  sideStatus: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
  },

  emptyTextSmall: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 500,
  },

  bottomGlow: {
    marginTop: "12px",
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