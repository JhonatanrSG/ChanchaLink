import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 3;
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function normalizeHora(hora) {
  if (!hora) return "--";
  return hora.slice(0, 5);
}

function formatEstadoPartido(estado) {
  if (estado === "abierto") return "Abierto";
  if (estado === "cerrado") return "Cerrado";
  if (estado === "cancelado") return "Cancelado";
  return estado || "Sin estado";
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

export default function MyPartidosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const response = await api.get("/partidos/mis-partidos/");
        setPartidos(response.data);
      } catch (err) {
        console.error("ERROR CARGANDO MIS PARTIDOS:", err);
        setError("No fue posible cargar tus partidos.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, []);

  const estados = useMemo(() => {
    return Array.from(
      new Set(partidos.map((partido) => partido.estado_partido?.trim()).filter(Boolean))
    );
  }, [partidos]);

  const niveles = useMemo(() => {
    return Array.from(
      new Set(partidos.map((partido) => partido.nivel_partido?.trim()).filter(Boolean))
    );
  }, [partidos]);

  const filteredPartidos = useMemo(() => {
    return partidos.filter((partido) => {
      const term = search.toLowerCase();

      const matchesSearch =
        !search ||
        partido.cancha_nombre?.toLowerCase().includes(term) ||
        partido.estado_partido?.toLowerCase().includes(term) ||
        partido.nivel_partido?.toLowerCase().includes(term) ||
        partido.fecha_reserva?.toLowerCase().includes(term);

      const matchesState =
        !stateFilter || partido.estado_partido === stateFilter;

      const matchesLevel =
        !levelFilter || partido.nivel_partido === levelFilter;

      return matchesSearch && matchesState && matchesLevel;
    });
  }, [partidos, search, stateFilter, levelFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stateFilter, levelFilter]);

  const totalPages = Math.ceil(filteredPartidos.length / ITEMS_PER_PAGE);

  const paginatedPartidos = filteredPartidos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resumen = useMemo(() => {
    return {
      total: partidos.length,
      abiertos: partidos.filter((p) => p.estado_partido === "abierto").length,
      cerrados: partidos.filter((p) => p.estado_partido === "cerrado").length,
      cancelados: partidos.filter((p) => p.estado_partido === "cancelado").length,
    };
  }, [partidos]);

  const primerPartido = partidos[0] || null;

  const handlePrimaryMouseEnter = (e) => {
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando partidos...</p>
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

                    <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                      <span style={styles.navIcon}>⚽</span>
                      <span>Mis partidos</span>
                    </div>

                    <Link to="/equipos" style={styles.navItem}>
                      <span style={styles.navIcon}>👥</span>
                      <span>Mis equipos</span>
                    </Link>
                  </nav>
                </aside>

                <section style={styles.content}>
                  <div style={styles.heroBlock}>
                    <h1 style={styles.title}>⚽ Mis partidos</h1>
                    <p style={styles.subtitle}>
                      Gestiona los partidos que has publicado.
                    </p>

                    <div style={styles.filtersBar}>
                      <div style={{ ...styles.filterBox, ...styles.searchBox }}>
                        <span style={styles.filterIcon}>🔎</span>
                        <input
                          type="text"
                          placeholder="Buscar por cancha, estado, nivel o fecha..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={styles.searchInput}
                        />
                      </div>

                      <div style={styles.filterBox}>
                        <span style={styles.filterIcon}>📌</span>
                        <select
                          value={stateFilter}
                          onChange={(e) => setStateFilter(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Todos los estados</option>
                          {estados.map((estado) => (
                            <option key={estado} value={estado}>
                              {formatEstadoPartido(estado)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.filterBox}>
                        <span style={styles.filterIcon}>🏅</span>
                        <select
                          value={levelFilter}
                          onChange={(e) => setLevelFilter(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Todos los niveles</option>
                          {niveles.map((nivel) => (
                            <option key={nivel} value={nivel}>
                              {formatNivel(nivel)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}

                  <div style={styles.topRow}>
                    <section style={styles.summaryCard}>
                      <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Resumen general</h2>
                      </div>

                      <div style={styles.kpiGrid}>
                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Total</p>
                          <h3 style={styles.kpiValue}>{resumen.total}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Abiertos</p>
                          <h3 style={styles.kpiValue}>{resumen.abiertos}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Cerrados</p>
                          <h3 style={styles.kpiValue}>{resumen.cerrados}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Cancelados</p>
                          <h3 style={styles.kpiValue}>{resumen.cancelados}</h3>
                        </div>
                      </div>
                    </section>

                    <section style={styles.nextCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Próximo partido</h2>
                      </div>

                      {primerPartido ? (
                        <>
                          <p style={styles.nextName}>
                            {primerPartido.cancha_nombre}
                          </p>
                          <p style={styles.nextLine}>
                            📅 {primerPartido.fecha_reserva}
                          </p>
                          <p style={styles.nextLine}>
                            🕒 {normalizeHora(primerPartido.hora_inicio)} -{" "}
                            {normalizeHora(primerPartido.hora_fin)}
                          </p>
                          <p style={styles.nextLine}>
                            🟡 {formatNivel(primerPartido.nivel_partido)}
                          </p>

                          <div style={styles.nextBadgeWrap}>
                            <span
                              style={{
                                ...styles.sideStatus,
                                background:
                                  primerPartido.estado_partido === "cancelado"
                                    ? RED
                                    : GREEN,
                              }}
                            >
                              {formatEstadoPartido(primerPartido.estado_partido)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p style={styles.emptyTextSmall}>
                          No has creado partidos todavía.
                        </p>
                      )}
                    </section>
                  </div>

                  {!filteredPartidos.length ? (
                    <div style={styles.emptyBox}>
                      <p style={styles.emptyText}>
                        No encontramos partidos con esos filtros.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.grid}>
                      {paginatedPartidos.map((partido) => (
                        <article key={partido.id} style={styles.card}>
                          <div style={styles.imageWrapper}>
                            <img
                              src={getImageOrFallback(partido.cancha_imagen)}
                              alt={partido.cancha_nombre}
                              style={styles.image}
                            />
                          </div>

                          <div style={styles.cardBody}>
                            <div style={styles.cardTopRow}>
                              <h2 style={styles.cardTitle}>
                                {partido.cancha_nombre}
                              </h2>

                              <span
                                style={{
                                  ...styles.estadoBadge,
                                  background:
                                    partido.estado_partido === "cancelado"
                                      ? RED
                                      : GREEN,
                                }}
                              >
                                {formatEstadoPartido(partido.estado_partido)}
                              </span>
                            </div>

                            <p style={styles.locationRow}>
                              📅 {partido.fecha_reserva || "Fecha no disponible"}
                            </p>

                            <div style={styles.metaRow}>
                              <span style={styles.metaItem}>
                                🕒 {normalizeHora(partido.hora_inicio)} -{" "}
                                {normalizeHora(partido.hora_fin)}
                              </span>

                              <span style={styles.metaItem}>
                                🏅 {formatNivel(partido.nivel_partido)}
                              </span>
                            </div>

                            <div style={styles.infoGrid}>
                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Estado</span>
                                <span style={styles.infoValue}>
                                  {formatEstadoPartido(partido.estado_partido)}
                                </span>
                              </div>

                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Tipo</span>
                                <span style={styles.infoValue}>
                                  {formatTipoFutbol(partido.cancha_tipo_futbol)}
                                </span>
                              </div>
                            </div>

                            <div style={styles.actions}>
                              <button
                                type="button"
                                style={styles.primaryButton}
                                onClick={() =>
                                  navigate(`/partidos/gestionar/${partido.id}`)
                                }
                                onMouseEnter={handlePrimaryMouseEnter}
                                onMouseLeave={handlePrimaryMouseLeave}
                              >
                                Gestionar postulaciones
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div style={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        disabled={currentPage === 1}
                        style={{
                          ...styles.pageButton,
                          opacity: currentPage === 1 ? 0.45 : 1,
                          cursor: currentPage === 1 ? "default" : "pointer",
                        }}
                      >
                        ‹
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        const isActive = currentPage === page;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            style={{
                              ...styles.pageNumber,
                              background: isActive
                                ? "#1ea133"
                                : "rgba(255,255,255,0.10)",
                              border: isActive
                                ? "1px solid rgba(255,255,255,0.35)"
                                : "1px solid rgba(255,255,255,0.18)",
                              color: "#ffffff",
                            }}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          ...styles.pageButton,
                          opacity: currentPage === totalPages ? 0.45 : 1,
                          cursor: currentPage === totalPages ? "default" : "pointer",
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  <div style={styles.featuresRow}>
                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>⚽</span>
                      <span style={styles.featureText}>Partidos publicados</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>👥</span>
                      <span style={styles.featureText}>Jugadores postulados</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>🏅</span>
                      <span style={styles.featureText}>Niveles de juego</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>✅</span>
                      <span style={styles.featureText}>Gestión rápida</span>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "18px",
  },

  title: {
    margin: "6px 0 10px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  subtitle: {
    margin: "0 0 16px",
    color: "#e2e8f0",
    fontSize: "16px",
    fontWeight: 500,
    textAlign: "center",
    textShadow: "0 4px 14px rgba(0,0,0,0.30)",
  },

  filtersBar: {
    width: "100%",
    background: "rgba(255,255,255,0.94)",
    borderRadius: "14px",
    padding: "10px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "10px",
    boxShadow: "0 16px 34px rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.35)",
  },

  filterBox: {
    height: "50px",
    borderRadius: "12px",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  searchBox: {
    paddingRight: "10px",
  },

  filterIcon: {
    width: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    color: "#16a34a",
    flexShrink: 0,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#334155",
  },

  select: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#334155",
    cursor: "pointer",
    paddingRight: "12px",
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

  nextCard: {
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

  nextName: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: 900,
    lineHeight: 1.2,
  },

  nextLine: {
    margin: "0 0 7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.35,
  },

  nextBadgeWrap: {
    display: "flex",
    marginTop: "10px",
  },

  emptyBox: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  emptyText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
  },

  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "16px",
    padding: "10px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.40)",
    minWidth: 0,
  },

  imageWrapper: {
    width: "100%",
    height: "150px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#dbe4ee",
    marginBottom: "10px",
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
    gap: "10px",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  cardTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.15,
  },

  estadoBadge: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  locationRow: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    color: "#475569",
    fontSize: "13px",
    flexWrap: "wrap",
  },

  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: 700,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  infoBox: {
    background: "#f8fafc",
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
    marginTop: "4px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 14px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    flex: 1,
    minWidth: "140px",
  },

  pagination: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },

  pageButton: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: "18px",
  },

  pageNumber: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  sideStatus: {
    background: GREEN,
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