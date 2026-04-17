import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const ITEMS_PER_PAGE = 6;
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";

function formatEstado(estado) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "aceptada") return "Aceptada";
  if (estado === "rechazada") return "Rechazada";
  return estado || "Sin estado";
}

function formatPosicion(posicion) {
  if (!posicion) return "No definida";
  return posicion.charAt(0).toUpperCase() + posicion.slice(1);
}

export default function ManagePartidoPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPostulaciones = async () => {
    try {
      const response = await api.get(`/partidos/${id}/postulaciones/`);
      setPostulaciones(response.data);
    } catch (err) {
      console.error("ERROR CARGANDO POSTULACIONES:", err);
      setError("No fue posible cargar las postulaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostulaciones();
  }, [id]);

  const handleDecision = async (postulacionId, action) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/postulaciones/${postulacionId}/${action}/`);
      setSuccess(
        `Postulación ${action === "aceptar" ? "aceptada" : "rechazada"} correctamente.`
      );
      await fetchPostulaciones();
    } catch (err) {
      console.error("ERROR GESTIONANDO POSTULACIÓN:", err);
      setError("No fue posible actualizar la postulación.");
    }
  };

  const estados = useMemo(() => {
    return Array.from(
      new Set(postulaciones.map((item) => item.estado_postulacion?.trim()).filter(Boolean))
    );
  }, [postulaciones]);

  const posiciones = useMemo(() => {
    return Array.from(
      new Set(postulaciones.map((item) => item.posicion_postulada?.trim()).filter(Boolean))
    );
  }, [postulaciones]);

  const filteredPostulaciones = useMemo(() => {
    return postulaciones.filter((item) => {
      const term = search.toLowerCase();

      const matchesSearch =
        !search ||
        item.usuario_nombre?.toLowerCase().includes(term) ||
        item.usuario_email?.toLowerCase().includes(term) ||
        item.posicion_postulada?.toLowerCase().includes(term) ||
        item.nota?.toLowerCase().includes(term);

      const matchesState =
        !stateFilter || item.estado_postulacion === stateFilter;

      const matchesPosition =
        !positionFilter || item.posicion_postulada === positionFilter;

      return matchesSearch && matchesState && matchesPosition;
    });
  }, [postulaciones, search, stateFilter, positionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stateFilter, positionFilter]);

  const totalPages = Math.ceil(filteredPostulaciones.length / ITEMS_PER_PAGE);

  const paginatedPostulaciones = filteredPostulaciones.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resumen = useMemo(() => {
    return {
      total: postulaciones.length,
      pendientes: postulaciones.filter((p) => p.estado_postulacion === "pendiente").length,
      aceptadas: postulaciones.filter((p) => p.estado_postulacion === "aceptada").length,
      rechazadas: postulaciones.filter((p) => p.estado_postulacion === "rechazada").length,
    };
  }, [postulaciones]);

  const primeraPendiente = useMemo(() => {
    return postulaciones.find((p) => p.estado_postulacion === "pendiente") || null;
  }, [postulaciones]);

  const handlePrimaryMouseEnter = (e) => {
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    e.currentTarget.style.background = GREEN;
  };

  const handleRejectMouseEnter = (e) => {
    e.currentTarget.style.opacity = "0.9";
  };

  const handleRejectMouseLeave = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando postulaciones...</p>
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
                    <h1 style={styles.title}>👥 Gestionar postulaciones</h1>
                    <p style={styles.subtitle}>
                      Acepta o rechaza jugadores para tu partido.
                    </p>

                    <div style={styles.filtersBar}>
                      <div style={{ ...styles.filterBox, ...styles.searchBox }}>
                        <span style={styles.filterIcon}>🔎</span>
                        <input
                          type="text"
                          placeholder="Buscar por nombre, correo, posición o nota..."
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
                              {formatEstado(estado)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.filterBox}>
                        <span style={styles.filterIcon}>🧍</span>
                        <select
                          value={positionFilter}
                          onChange={(e) => setPositionFilter(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Todas las posiciones</option>
                          {posiciones.map((posicion) => (
                            <option key={posicion} value={posicion}>
                              {formatPosicion(posicion)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}

                  <div style={styles.topRow}>
                    <section style={styles.summaryCard}>
                      <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Resumen de postulaciones</h2>
                      </div>

                      <div style={styles.kpiGrid}>
                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Total</p>
                          <h3 style={styles.kpiValue}>{resumen.total}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Pendientes</p>
                          <h3 style={styles.kpiValue}>{resumen.pendientes}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Aceptadas</p>
                          <h3 style={styles.kpiValue}>{resumen.aceptadas}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Rechazadas</p>
                          <h3 style={styles.kpiValue}>{resumen.rechazadas}</h3>
                        </div>
                      </div>
                    </section>

                    <section style={styles.nextCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Siguiente por revisar</h2>
                      </div>

                      {primeraPendiente ? (
                        <>
                          <p style={styles.nextName}>{primeraPendiente.usuario_nombre}</p>
                          <p style={styles.nextLine}>
                            📧 {primeraPendiente.usuario_email}
                          </p>
                          <p style={styles.nextLine}>
                            🧍 {formatPosicion(primeraPendiente.posicion_postulada)}
                          </p>
                          <p style={styles.nextLine}>
                            📝 {primeraPendiente.nota || "Sin nota"}
                          </p>

                          <div style={styles.nextBadgeWrap}>
                            <span style={{ ...styles.sideStatus, background: SLATE }}>
                              Pendiente
                            </span>
                          </div>
                        </>
                      ) : (
                        <p style={styles.emptyTextSmall}>
                          No hay postulaciones pendientes por revisar.
                        </p>
                      )}
                    </section>
                  </div>

                  {!filteredPostulaciones.length ? (
                    <div style={styles.emptyBox}>
                      <p style={styles.emptyText}>
                        No encontramos postulaciones con esos filtros.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.grid}>
                      {paginatedPostulaciones.map((item) => (
                        <article key={item.id} style={styles.card}>
                          <div style={styles.cardBody}>
                            <div style={styles.cardTopRow}>
                              <div style={styles.userIdentity}>
                                <div style={styles.userAvatar}>
                                  {(item.usuario_nombre || "U").charAt(0).toUpperCase()}
                                </div>

                                <div style={styles.userInfo}>
                                  <h3 style={styles.cardTitle}>{item.usuario_nombre}</h3>
                                  <p style={styles.userEmail}>{item.usuario_email}</p>
                                </div>
                              </div>

                              <span
                                style={{
                                  ...styles.estadoBadge,
                                  background:
                                    item.estado_postulacion === "rechazada"
                                      ? RED
                                      : item.estado_postulacion === "aceptada"
                                      ? GREEN
                                      : SLATE,
                                }}
                              >
                                {formatEstado(item.estado_postulacion)}
                              </span>
                            </div>

                            <div style={styles.infoGrid}>
                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Posición</span>
                                <span style={styles.infoValue}>
                                  {formatPosicion(item.posicion_postulada)}
                                </span>
                              </div>

                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Estado</span>
                                <span style={styles.infoValue}>
                                  {formatEstado(item.estado_postulacion)}
                                </span>
                              </div>
                            </div>

                            <div style={styles.noteBox}>
                              <span style={styles.infoLabel}>Nota del jugador</span>
                              <p style={styles.noteText}>{item.nota || "Sin nota"}</p>
                            </div>

                            {item.estado_postulacion === "pendiente" && (
                              <div style={styles.actions}>
                                <button
                                  type="button"
                                  style={styles.acceptButton}
                                  onClick={() => handleDecision(item.id, "aceptar")}
                                  onMouseEnter={handlePrimaryMouseEnter}
                                  onMouseLeave={handlePrimaryMouseLeave}
                                >
                                  Aceptar
                                </button>

                                <button
                                  type="button"
                                  style={styles.rejectButton}
                                  onClick={() => handleDecision(item.id, "rechazar")}
                                  onMouseEnter={handleRejectMouseEnter}
                                  onMouseLeave={handleRejectMouseLeave}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
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
    padding: "16px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.40)",
    minWidth: 0,
  },

  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  userIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
    flex: 1,
  },

  userAvatar: {
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "18px",
    flexShrink: 0,
  },

  userInfo: {
    minWidth: 0,
  },

  cardTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.15,
  },

  userEmail: {
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

  noteBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
  },

  noteText: {
    margin: "6px 0 0",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  acceptButton: {
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
    minWidth: "120px",
  },

  rejectButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 14px",
    background: RED,
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    flex: 1,
    minWidth: "120px",
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