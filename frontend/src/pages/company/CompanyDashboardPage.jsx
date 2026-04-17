import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";
const RESERVAS_PER_PAGE = 4;

function buildMediaUrl(path) {
  if (!path) return null;

  if (typeof path === "string") {
    const cleanPath = path.trim();

    if (!cleanPath) return null;

    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath;
    }

    if (cleanPath.startsWith("/")) {
      return `${BACKEND_URL}${cleanPath}`;
    }

    return `${BACKEND_URL}/${cleanPath}`;
  }

  if (typeof path === "object") {
    if (typeof path.url === "string" && path.url.trim()) {
      return buildMediaUrl(path.url);
    }

    if (typeof path.imagen === "string" && path.imagen.trim()) {
      return buildMediaUrl(path.imagen);
    }
  }

  return null;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString("es-CO")}`;
}

function normalizeHora(hora) {
  if (!hora) return "--";
  return hora.slice(0, 5);
}

function formatEstadoReserva(estado) {
  if (estado === "confirmada") return "Confirmada";
  if (estado === "pendiente") return "Pendiente";
  if (estado === "cancelada") return "Cancelada";
  return estado || "Sin estado";
}

function formatEstadoCancha(estado) {
  if (!estado) return "No definido";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Fútbol";
  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);

  if (!isNaN(numero)) return `Fútbol ${numero}`;
  return tipo;
}

export default function CompanyDashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [periodo, setPeriodo] = useState("dia");

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");
  const [currentReservaPage, setCurrentReservaPage] = useState(1);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/empresa/profile/");
        setCompanyProfile(response.data);
      } catch (err) {
        console.error("ERROR PERFIL EMPRESA:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/empresa/dashboard/");
        setDashboard(response.data);
      } catch (err) {
        console.error("ERROR DASHBOARD EMPRESA:", err);
        setError("No fue posible cargar el dashboard de empresa.");
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      setLoadingStats(true);

      try {
        const response = await api.get(`/empresa/estadisticas/?periodo=${periodo}`);
        setEstadisticas(response.data);
      } catch (err) {
        console.error("ERROR ESTADÍSTICAS EMPRESA:", err);
        setError("No fue posible cargar las estadísticas.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchEstadisticas();
  }, [periodo]);

  const resumen = dashboard?.resumen || {};
  const canchas = dashboard?.canchas || [];
  const ultimasReservas = dashboard?.ultimas_reservas || [];
  const primeraReserva = ultimasReservas[0] || null;
  const companyAvatar = buildMediaUrl(user?.foto_perfil);

  useEffect(() => {
    setCurrentReservaPage(1);
  }, [ultimasReservas.length]);

  const totalReservaPages = Math.max(
    1,
    Math.ceil(ultimasReservas.length / RESERVAS_PER_PAGE)
  );

  const reservasPaginadas = useMemo(() => {
    const start = (currentReservaPage - 1) * RESERVAS_PER_PAGE;
    const end = start + RESERVAS_PER_PAGE;
    return ultimasReservas.slice(start, end);
  }, [ultimasReservas, currentReservaPage]);

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loadingDashboard ? (
              <p style={styles.statusText}>Cargando dashboard empresarial...</p>
            ) : (
              <>
                <aside style={styles.sidebar}>
                  <div style={styles.sidebarProfile}>
                    <div style={styles.avatarWrap}>
                      <img
                        src={companyAvatar || "/images/logo-balon.png"}
                        alt={companyProfile?.nombre_empresa || user?.username || "Empresa"}
                        style={styles.avatar}
                        onError={(e) => {
                          e.currentTarget.src = "/images/logo-balon.png";
                        }}
                      />
                    </div>

                    <div style={styles.profileInfo}>
                      <h3 style={styles.profileName}>
                        {companyProfile?.nombre_empresa || user?.username || "Empresa"}
                      </h3>
                      <p style={styles.profileSub}>
                        ID empresa: {companyProfile?.id || "--"}
                      </p>
                      <p style={styles.profileSub}>
                        {companyProfile?.correo_contacto || user?.email || "--"}
                      </p>
                    </div>
                  </div>

                  <nav style={styles.sidebarNav}>
                    <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                      <span style={styles.navIcon}>🏢</span>
                      <span>Panel empresa</span>
                    </div>

                    <Link to="/empresa/perfil" style={styles.navItem}>
                      <span style={styles.navIcon}>🪪</span>
                      <span>Perfil empresa</span>
                    </Link>

                    <Link to="/empresa/canchas" style={styles.navItem}>
                      <span style={styles.navIcon}>⚽</span>
                      <span>Gestión canchas</span>
                    </Link>

                    <Link to="/empresa/precios" style={styles.navItem}>
                      <span style={styles.navIcon}>💲</span>
                      <span>Horarios y precios</span>
                    </Link>
                  </nav>
                </aside>

                <section style={styles.content}>
                  <div style={styles.header}>
                    <h1 style={styles.title}>Panel empresa</h1>
                    <p style={styles.subtitle}>
                      Consulta el estado general de tus canchas, reservas e ingresos.
                    </p>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}

                  <section style={styles.summaryCard}>
                    <div style={styles.sectionHeader}>
                      <h2 style={styles.sectionTitle}>Resumen general</h2>
                    </div>

                    <div style={styles.kpiGrid}>
                      <div style={styles.kpiCard}>
                        <p style={styles.kpiLabel}>Canchas</p>
                        <h3 style={styles.kpiValue}>{resumen.total_canchas || 0}</h3>
                      </div>

                      <div style={styles.kpiCard}>
                        <p style={styles.kpiLabel}>Reservas activas</p>
                        <h3 style={styles.kpiValue}>{resumen.reservas_activas || 0}</h3>
                      </div>

                      <div style={styles.kpiCard}>
                        <p style={styles.kpiLabel}>Reservas hoy</p>
                        <h3 style={styles.kpiValue}>{resumen.reservas_hoy || 0}</h3>
                      </div>

                      <div style={styles.kpiCard}>
                        <p style={styles.kpiLabel}>Ingresos hoy</p>
                        <h3 style={styles.kpiValue}>
                          {formatMoney(resumen.ingresos_hoy)}
                        </h3>
                      </div>

                      <div style={styles.kpiCard}>
                        <p style={styles.kpiLabel}>Partidos activos</p>
                        <h3 style={styles.kpiValue}>{resumen.partidos_activos || 0}</h3>
                      </div>
                    </div>
                  </section>

                  <div style={styles.mainGrid}>
                    <div style={styles.leftColumn}>
                      <section style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                          <h2 style={styles.sectionTitle}>Mis canchas</h2>
                        </div>

                        {canchas.length === 0 ? (
                          <p style={styles.emptyText}>No tienes canchas registradas.</p>
                        ) : (
                          <div style={styles.cardGrid}>
                            {canchas.map((cancha) => {
                              console.log("CANCHA DASHBOARD:", cancha);

                              return (
                                <article key={cancha.id} style={styles.infoCard}>
                                  <div style={styles.imageWrapper}>
                                    <img
                                      src={getImageOrFallback(cancha.imagen)}
                                      alt={cancha.nombre}
                                      style={styles.image}
                                      onError={(e) => {
                                        console.log("ERROR IMAGEN CANCHA:", cancha.imagen);
                                        e.currentTarget.src = FALLBACK_IMAGE;
                                      }}
                                    />
                                  </div>

                                  <div style={styles.cardBody}>
                                    <h3 style={styles.cardTitle}>{cancha.nombre}</h3>

                                    <p style={styles.cardText}>
                                      <strong>Tipo:</strong> {formatTipoFutbol(cancha.tipo_futbol)}
                                    </p>
                                    <p style={styles.cardText}>
                                      <strong>Estado:</strong>{" "}
                                      {formatEstadoCancha(cancha.estado_operativo)}
                                    </p>
                                    <p style={styles.cardText}>
                                      <strong>Activa:</strong> {cancha.activa ? "Sí" : "No"}
                                    </p>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <section style={styles.sectionCard}>
                        <div style={styles.statsHeader}>
                          <h2 style={styles.sectionTitle}>Estadísticas</h2>

                          <select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            style={styles.select}
                          >
                            <option value="dia">Día</option>
                            <option value="semana">Semana</option>
                            <option value="mes">Mes</option>
                          </select>
                        </div>

                        {loadingStats ? (
                          <p style={styles.emptyText}>Cargando estadísticas...</p>
                        ) : estadisticas ? (
                          <>
                            <div style={styles.kpiGridStats}>
                              <div style={styles.kpiCard}>
                                <p style={styles.kpiLabel}>Total reservas</p>
                                <h3 style={styles.kpiValue}>
                                  {estadisticas.total_reservas || 0}
                                </h3>
                              </div>

                              <div style={styles.kpiCard}>
                                <p style={styles.kpiLabel}>Total ingresos</p>
                                <h3 style={styles.kpiValue}>
                                  {formatMoney(estadisticas.total_ingresos)}
                                </h3>
                              </div>
                            </div>

                            <div style={styles.statsBlock}>
                              <h3 style={styles.subsectionTitle}>Serie del período</h3>

                              {estadisticas.serie?.length === 0 ? (
                                <p style={styles.emptyText}>No hay datos para este período.</p>
                              ) : (
                                <div style={styles.miniCardGrid}>
                                  {estadisticas.serie?.map((item, index) => (
                                    <div
                                      key={`${item.label}-${index}`}
                                      style={styles.miniInfoCard}
                                    >
                                      <h4 style={styles.cardTitleSmall}>{item.label}</h4>
                                      <p style={styles.cardText}>
                                        <strong>Reservas:</strong> {item.reservas}
                                      </p>
                                      <p style={styles.cardText}>
                                        <strong>Ingresos:</strong>{" "}
                                        {formatMoney(item.ingresos)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div style={styles.statsBlock}>
                              <h3 style={styles.subsectionTitle}>Ingresos por cancha</h3>

                              {estadisticas.ingresos_por_cancha?.length === 0 ? (
                                <p style={styles.emptyText}>No hay ingresos registrados.</p>
                              ) : (
                                <div style={styles.miniCardGrid}>
                                  {estadisticas.ingresos_por_cancha?.map((item) => (
                                    <div key={item.cancha_id} style={styles.miniInfoCard}>
                                      <h4 style={styles.cardTitleSmall}>
                                        {item.cancha_nombre}
                                      </h4>
                                      <p style={styles.cardText}>
                                        <strong>Ingresos:</strong>{" "}
                                        {formatMoney(item.ingresos)}
                                      </p>
                                      <p style={styles.cardText}>
                                        <strong>Reservas:</strong> {item.reservas}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : null}
                      </section>
                    </div>

                    <aside style={styles.rightColumn}>
                      <section style={styles.sideCard}>
                        <div style={styles.sectionHeader}>
                          <h2 style={styles.sideTitle}>Últimas reservas</h2>
                          {totalReservaPages > 1 && (
                            <div style={styles.sidePagination}>
                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentReservaPage((prev) => Math.max(prev - 1, 1))
                                }
                                disabled={currentReservaPage === 1}
                                style={{
                                  ...styles.sidePageButton,
                                  opacity: currentReservaPage === 1 ? 0.45 : 1,
                                  cursor:
                                    currentReservaPage === 1 ? "default" : "pointer",
                                }}
                              >
                                ‹
                              </button>

                              <span style={styles.sidePageText}>
                                {currentReservaPage}/{totalReservaPages}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setCurrentReservaPage((prev) =>
                                    Math.min(prev + 1, totalReservaPages)
                                  )
                                }
                                disabled={currentReservaPage === totalReservaPages}
                                style={{
                                  ...styles.sidePageButton,
                                  opacity:
                                    currentReservaPage === totalReservaPages ? 0.45 : 1,
                                  cursor:
                                    currentReservaPage === totalReservaPages
                                      ? "default"
                                      : "pointer",
                                }}
                              >
                                ›
                              </button>
                            </div>
                          )}
                        </div>

                        {ultimasReservas.length === 0 ? (
                          <p style={styles.emptyTextSmall}>No hay reservas registradas.</p>
                        ) : (
                          <div style={styles.reservationList}>
                            {reservasPaginadas.map((reserva) => (
                              <div key={reserva.id} style={styles.reservationItem}>
                                <p style={styles.reservationName}>
                                  {reserva.usuario_email ||
                                    reserva.nombre_contacto ||
                                    "Visitante"}
                                </p>
                                <p style={styles.reservationLine}>
                                  {reserva.cancha_nombre}
                                </p>
                                <p style={styles.reservationLine}>
                                  {reserva.fecha_reserva} · {normalizeHora(reserva.hora_inicio)}
                                </p>
                                <span
                                  style={{
                                    ...styles.statusMiniBadge,
                                    background:
                                      reserva.estado_reserva === "cancelada"
                                        ? RED
                                        : reserva.estado_reserva === "pendiente"
                                        ? ORANGE
                                        : GREEN,
                                  }}
                                >
                                  {formatEstadoReserva(reserva.estado_reserva)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section style={styles.sideCard}>
                        <h2 style={styles.sideTitle}>Reserva destacada</h2>

                        {primeraReserva ? (
                          <>
                            <p style={styles.sideItemTitle}>
                              {primeraReserva.cancha_nombre}
                            </p>
                            <p style={styles.sideLine}>
                              👤{" "}
                              {primeraReserva.usuario_email ||
                                primeraReserva.nombre_contacto ||
                                "Visitante"}
                            </p>
                            <p style={styles.sideLine}>
                              📅 {primeraReserva.fecha_reserva}
                            </p>
                            <p style={styles.sideLine}>
                              🕒 {normalizeHora(primeraReserva.hora_inicio)} -{" "}
                              {normalizeHora(primeraReserva.hora_fin)}
                            </p>
                            <p style={styles.sideLine}>
                              💳 {formatMoney(primeraReserva.precio_final)}
                            </p>

                            <div style={styles.sideButtons}>
                              <span
                                style={{
                                  ...styles.sideStatus,
                                  background:
                                    primeraReserva.estado_reserva === "cancelada"
                                      ? RED
                                      : primeraReserva.estado_reserva === "pendiente"
                                      ? ORANGE
                                      : GREEN,
                                }}
                              >
                                {formatEstadoReserva(primeraReserva.estado_reserva)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p style={styles.emptyTextSmall}>No hay reservas destacadas.</p>
                        )}
                      </section>
                    </aside>
                  </div>

                  <div style={styles.featuresRow}>
                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>🏟️</span>
                      <span style={styles.featureText}>Control de canchas</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>📅</span>
                      <span style={styles.featureText}>Reservas del día</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>💰</span>
                      <span style={styles.featureText}>Ingresos rápidos</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>📊</span>
                      <span style={styles.featureText}>Estadísticas</span>
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
    width: "72px",
    height: "72px",
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
    gridColumn: "1 / -1",
  },

  summaryCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    marginBottom: "16px",
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

  subsectionTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 900,
  },

  statsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    gap: "12px",
    flexWrap: "wrap",
  },

  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontWeight: 700,
    color: "#334155",
    background: "#ffffff",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "12px",
  },

  kpiGridStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
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

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.85fr 0.85fr",
    gap: "16px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  sideCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sideTitle: {
    margin: 0,
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
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
  },

  sidePagination: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  sidePageButton: {
    minWidth: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 800,
  },

  sidePageText: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: 800,
    minWidth: "34px",
    textAlign: "center",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  miniCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  infoCard: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  miniInfoCard: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid #e2e8f0",
  },

  imageWrapper: {
    width: "100%",
    height: "145px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#dbe4ee",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  cardBody: {
    display: "flex",
    flexDirection: "column",
  },

  cardTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.15,
  },

  cardTitleSmall: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 900,
  },

  cardText: {
    margin: "0 0 6px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 500,
  },

  statsBlock: {
    marginTop: "18px",
  },

  reservationList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  reservationItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
  },

  reservationName: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 900,
  },

  reservationLine: {
    margin: "0 0 4px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
  },

  statusMiniBadge: {
    display: "inline-block",
    marginTop: "6px",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "12px",
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
    maxWidth: "900px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
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
    fontSize: "24px",
    lineHeight: 1,
  },

  featureText: {
    maxWidth: "120px",
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