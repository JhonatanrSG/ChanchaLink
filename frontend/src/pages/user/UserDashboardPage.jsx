import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const BACKEND_URL = "http://127.0.0.1:8000";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function formatFecha(fecha) {
  if (!fecha) return "--";
  const date = new Date(`${fecha}T00:00:00`);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
}

function normalizeHora(hora) {
  if (!hora) return "--";
  return hora.slice(0, 5);
}

function formatEstadoReserva(estado) {
  if (estado === "confirmada") return "Confirmado";
  if (estado === "pendiente") return "Pendiente";
  if (estado === "cancelada") return "Cancelada";
  return estado || "Sin estado";
}

function formatEstadoPartido(estado) {
  if (estado === "abierto") return "Abierto";
  if (estado === "cerrado") return "Cerrado";
  if (estado === "cancelado") return "Cancelado";
  return estado || "Abierto";
}

function formatNivel(nivel) {
  if (nivel === "recreativo") return "Recreativo";
  if (nivel === "intermedio") return "Intermedio";
  if (nivel === "competitivo") return "Competitivo";
  return nivel || "Sin nivel";
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Fútbol";
  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);

  if (!isNaN(numero)) return `Fútbol ${numero}`;
  return tipo;
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString("es-CO")}`;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/users/dashboard/");
        setDashboard(response.data);
      } catch (err) {
        console.error("ERROR DASHBOARD USUARIO:", err);
        setError("No fue posible cargar el dashboard del usuario.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const resumen = dashboard?.resumen || {};
  const proximaReserva = dashboard?.proximas_reservas?.[0] || null;
  const misPartidos = dashboard?.mis_partidos || [];
  const misPostulaciones = dashboard?.mis_postulaciones || [];
  const misEquipos = dashboard?.mis_equipos || [];

  const primerPartido = useMemo(() => {
    return misPartidos.length > 0 ? misPartidos[0] : null;
  }, [misPartidos]);

  const primeraPostulacion = useMemo(() => {
    return misPostulaciones.length > 0 ? misPostulaciones[0] : null;
  }, [misPostulaciones]);

  const primerEquipo = useMemo(() => {
    return misEquipos.length > 0 ? misEquipos[0] : null;
  }, [misEquipos]);

  const handleButtonMouseEnter = (e) => {
    e.currentTarget.style.background = ORANGE;
  };

  const handleButtonMouseLeave = (e) => {
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando dashboard...</p>
            ) : (
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
                      <p style={styles.profileSub}>
                        ID: {user?.id || "--"}
                      </p>
                      <p style={styles.profileSub}>
                        {user?.nivel_juego ? formatNivel(user.nivel_juego) : "Jugador"}
                      </p>
                    </div>
                  </div>

                  <nav style={styles.sidebarNav}>
                    <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                      <span style={styles.navIcon}>👤</span>
                      <span>Mi Dashboard</span>
                    </div>

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


                    <Link to="/equipos" style={styles.navItem}>
                      <span style={styles.navIcon}>👥</span>
                      <span>Mis equipos</span>
                    </Link>
                  </nav>
                </aside>

                <section style={styles.content}>
                  <div style={styles.header}>
                    <h1 style={styles.title}>Mi Dashboard</h1>
                    <p style={styles.subtitle}>
                      Bienvenido a tu panel de control.
                    </p>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}

                  {dashboard && (
                    <div style={styles.mainGrid}>
                      <div style={styles.leftColumn}>
                        <section style={styles.heroCard}>
                          <h2 style={styles.heroGreeting}>
                            Hola, {user?.nombres || "Jugador"}
                          </h2>
                          <p style={styles.heroText}>
                            Bienvenido a tu panel de control.
                          </p>

                          <div style={styles.highlightCard}>
                            <div style={styles.highlightImageWrap}>
                              <img
                                src={getImageOrFallback(proximaReserva?.cancha_imagen)}
                                alt={proximaReserva?.cancha_nombre || "Cancha"}
                                style={styles.highlightImage}
                              />
                            </div>

                            <div style={styles.highlightContent}>
                              <h3 style={styles.highlightTitle}>
                                {proximaReserva?.cancha_nombre || "Aún no tienes reservas próximas"}
                              </h3>

                              {proximaReserva ? (
                                <>
                                  <p style={styles.highlightLocation}>
                                    📍 {proximaReserva.cancha_ubicacion || "Ubicación no disponible"}
                                  </p>

                                  <div style={styles.highlightMeta}>
                                    <span style={styles.metaBadge}>
                                      ⚽ {formatTipoFutbol(proximaReserva.cancha_tipo_futbol)}
                                    </span>
                                    <span style={styles.metaBadge}>
                                      👥 {proximaReserva.capacidad_jugadores || 10} jugadores
                                    </span>
                                  </div>

                                  <div style={styles.highlightFooter}>
                                    <span style={styles.dateBadge}>
                                      🕒 {formatFecha(proximaReserva.fecha_reserva)}
                                    </span>

                                    <span style={styles.stateBadge}>
                                      {formatEstadoReserva(proximaReserva.estado_reserva)}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <p style={styles.emptyText}>
                                  Reserva una cancha para comenzar a ver actividad aquí.
                                </p>
                              )}
                            </div>
                          </div>
                        </section>

                        <section style={styles.sectionCard}>
                          <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>Resumen general</h2>
                          </div>

                          <div style={styles.kpiGrid}>
                            <div style={styles.kpiCard}>
                              <p style={styles.kpiLabel}>Reservas</p>
                              <h3 style={styles.kpiValue}>{resumen.total_reservas || 0}</h3>
                            </div>

                            <div style={styles.kpiCard}>
                              <p style={styles.kpiLabel}>Partidos creados</p>
                              <h3 style={styles.kpiValue}>{resumen.total_partidos_creados || 0}</h3>
                            </div>

                            <div style={styles.kpiCard}>
                              <p style={styles.kpiLabel}>Postulaciones</p>
                              <h3 style={styles.kpiValue}>{resumen.total_postulaciones || 0}</h3>
                            </div>

                            <div style={styles.kpiCard}>
                              <p style={styles.kpiLabel}>Equipos</p>
                              <h3 style={styles.kpiValue}>{resumen.total_equipos || 0}</h3>
                            </div>
                          </div>
                        </section>

                        <section style={styles.sectionCard}>
                          <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>Próximas reservas</h2>
                          </div>

                          {proximaReserva ? (
                            <div style={styles.compactCard}>
                              <div style={styles.compactImageWrap}>
                                <img
                                  src={getImageOrFallback(proximaReserva.cancha_imagen)}
                                  alt={proximaReserva.cancha_nombre}
                                  style={styles.compactImage}
                                />
                              </div>

                              <div style={styles.compactInfo}>
                                <h3 style={styles.compactTitle}>
                                  {proximaReserva.cancha_nombre}
                                </h3>
                                <p style={styles.compactLocation}>
                                  📍 {proximaReserva.cancha_ubicacion || "Ubicación no disponible"}
                                </p>
                                <p style={styles.compactMeta}>
                                  🕒 {normalizeHora(proximaReserva.hora_inicio)} - {normalizeHora(proximaReserva.hora_fin)}
                                </p>
                              </div>

                              <div style={styles.compactActions}>
                                <Link
                                  to={`/reservas/${proximaReserva.id}`}
                                  style={styles.actionButton}
                                  onMouseEnter={handleButtonMouseEnter}
                                  onMouseLeave={handleButtonMouseLeave}
                                >
                                  Ver reserva
                                </Link>

                                <Link
                                  to={`/partidos/crear/${proximaReserva.id}`}
                                  style={styles.actionButton}
                                  onMouseEnter={handleButtonMouseEnter}
                                  onMouseLeave={handleButtonMouseLeave}
                                >
                                  Publicar partido
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p style={styles.emptyText}>No tienes reservas próximas.</p>
                          )}
                        </section>

                        <section style={styles.sectionCard}>
                          <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>Mis partidos publicados</h2>
                            <Link to="/partidos/mis-partidos" style={styles.moreLink}>
                              Ver más ›
                            </Link>
                          </div>

                          {primerPartido ? (
                            <div style={styles.compactCard}>
                              <div style={styles.compactImageWrap}>
                                <img
                                  src={getImageOrFallback(primerPartido.cancha_imagen)}
                                  alt={primerPartido.cancha_nombre}
                                  style={styles.compactImage}
                                />
                              </div>

                              <div style={styles.compactInfo}>
                                <h3 style={styles.compactTitle}>
                                  {primerPartido.cancha_nombre}
                                </h3>
                                <p style={styles.compactLocation}>
                                  📍 {primerPartido.cancha_ubicacion || "Ubicación no disponible"}
                                </p>
                                <p style={styles.compactMeta}>
                                  🕒 {normalizeHora(primerPartido.hora_inicio)} - {normalizeHora(primerPartido.hora_fin)}
                                </p>
                                <p style={styles.compactMeta}>
                                  🟡 {formatNivel(primerPartido.nivel_partido)}
                                </p>
                              </div>

                              <div style={styles.compactActions}>
                                <span style={styles.stateBadge}>
                                  {formatEstadoPartido(primerPartido.estado_partido)}
                                </span>

                                <Link
                                  to={`/partidos/${primerPartido.id}`}
                                  style={styles.actionButton}
                                  onMouseEnter={handleButtonMouseEnter}
                                  onMouseLeave={handleButtonMouseLeave}
                                >
                                  Ver postulaciones
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p style={styles.emptyText}>No has creado partidos todavía.</p>
                          )}
                        </section>
                      </div>

                      <aside style={styles.rightColumn}>
                        <section style={styles.sideCard}>
                          <h2 style={styles.sideTitle}>Próximos partidos</h2>

                          {primerPartido ? (
                            <>
                              <p style={styles.sideItemTitle}>{primerPartido.cancha_nombre}</p>
                              <p style={styles.sideLine}>
                                📅 {formatFecha(primerPartido.fecha_reserva)}
                              </p>
                              <p style={styles.sideLine}>
                                🕒 {normalizeHora(primerPartido.hora_inicio)} - {normalizeHora(primerPartido.hora_fin)}
                              </p>

                              <div style={styles.sideButtons}>
                                <span style={styles.sideStatus}>
                                  {formatEstadoPartido(primerPartido.estado_partido)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p style={styles.emptyTextSmall}>No tienes partidos activos.</p>
                          )}
                        </section>

                        <section style={styles.sideCard}>
                          <h2 style={styles.sideTitle}>Mis equipos</h2>

                          {primerEquipo ? (
                            <>
                              <p style={styles.sideItemTitle}>{primerEquipo.nombre_equipo}</p>
                              <p style={styles.sideLine}>
                                👥 Rol: {primerEquipo.rol_equipo}
                              </p>
                              <p style={styles.sideLine}>
                                ✅ {primerEquipo.activo ? "Activo" : "Inactivo"}
                              </p>
                            </>
                          ) : (
                            <p style={styles.emptyTextSmall}>No perteneces a equipos todavía.</p>
                          )}
                        </section>
                      </aside>
                    </div>
                  )}

                  <div style={styles.featuresRow}>
                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>🌐</span>
                      <span style={styles.featureText}>Canchas disponibles</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>👥</span>
                      <span style={styles.featureText}>Partidos activos</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>🧍</span>
                      <span style={styles.featureText}>Jugadores</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>✅</span>
                      <span style={styles.featureText}>Reserva fácil</span>
                    </div>
                  </div>

                  <div style={styles.bottomGlow} />
                </section>
              </>
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
    margin: 0,
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: 600,
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

  header: {
    marginBottom: "16px",
  },

  title: {
    margin: "0 0 4px",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 900,
    textShadow: "0 4px 14px rgba(0,0,0,0.30)",
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

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "16px",
    padding: "40px 0",
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.8fr",
    gap: "16px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  heroCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  heroGreeting: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 900,
  },

  heroText: {
    margin: "0 0 14px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 500,
  },

  highlightCard: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "14px",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "12px",
    border: "1px solid #e2e8f0",
  },

  highlightImageWrap: {
    width: "100%",
    height: "122px",
    borderRadius: "14px",
    overflow: "hidden",
    background: "#dbe4ee",
  },

  highlightImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  highlightContent: {
    minWidth: 0,
  },

  highlightTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
  },

  highlightLocation: {
    margin: "0 0 8px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  highlightMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },

  metaBadge: {
    background: "#eef6ef",
    color: "#166534",
    border: "1px solid #cde7d2",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "13px",
    fontWeight: 700,
  },

  highlightFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  dateBadge: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
  },

  stateBadge: {
    background: GREEN,
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 800,
  },

  sectionCard: {
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

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  moreLink: {
    color: "#334155",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
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
    fontSize: "34px",
    fontWeight: 900,
  },

  compactCard: {
    display: "grid",
    gridTemplateColumns: "130px 1fr auto",
    gap: "14px",
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "12px",
    border: "1px solid #e2e8f0",
  },

  compactImageWrap: {
    width: "100%",
    height: "92px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#dbe4ee",
  },

  compactImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  compactInfo: {
    minWidth: 0,
  },

  compactTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 900,
  },

  compactLocation: {
    margin: "0 0 4px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  compactMeta: {
    margin: "0 0 4px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  },

  compactActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "stretch",
    minWidth: "150px",
  },

  actionButton: {
    background: GREEN,
    color: "#ffffff",
    textDecoration: "none",
    textAlign: "center",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 800,
    transition: "all 0.2s ease",
  },

  sideCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sideTitle: {
    margin: "0 0 14px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  sideItemTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 900,
  },

  sideLine: {
    margin: "0 0 8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  },

  sideButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  sideStatus: {
    background: GREEN,
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
  },

  emptyTextSmall: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 500,
  },

  featuresRow: {
    marginTop: "18px",
    width: "100%",
    maxWidth: "880px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    alignItems: "start",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "15px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  featureIcon: {
    fontSize: "22px",
    lineHeight: 1,
  },

  featureText: {
    maxWidth: "120px",
  },

  bottomGlow: {
    marginTop: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "210px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};