import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const ITEMS_PER_PAGE = 3;
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";

function formatEstadoEquipo(activo) {
  return activo ? "Activo" : "Inactivo";
}

function formatRol(rol) {
  if (!rol) return "Sin rol";
  return rol.charAt(0).toUpperCase() + rol.slice(1);
}

function getTeamInitials(name) {
  if (!name) return "EQ";
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

export default function MyEquiposPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await api.get("/equipos/");
        setEquipos(response.data);
      } catch (err) {
        console.error("ERROR CARGANDO EQUIPOS:", err);
        setError("No fue posible cargar tus equipos.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipos();
  }, []);

  const estados = useMemo(() => {
    return Array.from(
      new Set(
        equipos
          .map((equipo) => (equipo.activo ? "activo" : "inactivo"))
          .filter(Boolean)
      )
    );
  }, [equipos]);

  const roles = useMemo(() => {
    return Array.from(
      new Set(equipos.map((equipo) => equipo.rol_equipo?.trim()).filter(Boolean))
    );
  }, [equipos]);

  const filteredEquipos = useMemo(() => {
    return equipos.filter((equipo) => {
      const term = search.toLowerCase();

      const matchesSearch =
        !search ||
        equipo.nombre_equipo?.toLowerCase().includes(term) ||
        equipo.descripcion?.toLowerCase().includes(term) ||
        equipo.rol_equipo?.toLowerCase().includes(term);

      const matchesState =
        !stateFilter ||
        (stateFilter === "activo" && equipo.activo) ||
        (stateFilter === "inactivo" && !equipo.activo);

      const matchesRole =
        !roleFilter || equipo.rol_equipo === roleFilter;

      return matchesSearch && matchesState && matchesRole;
    });
  }, [equipos, search, stateFilter, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stateFilter, roleFilter]);

  const totalPages = Math.ceil(filteredEquipos.length / ITEMS_PER_PAGE);

  const paginatedEquipos = filteredEquipos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resumen = useMemo(() => {
    return {
      total: equipos.length,
      activos: equipos.filter((e) => e.activo).length,
      inactivos: equipos.filter((e) => !e.activo).length,
      liderados: equipos.filter(
        (e) => (e.rol_equipo || "").toLowerCase() === "capitan"
      ).length,
    };
  }, [equipos]);

  const primerEquipo = equipos[0] || null;

  const handlePrimaryMouseEnter = (e) => {
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    e.currentTarget.style.background = GREEN;
  };

  const handleDarkMouseEnter = (e) => {
    e.currentTarget.style.opacity = "0.9";
  };

  const handleDarkMouseLeave = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando equipos...</p>
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
                    <h1 style={styles.title}>👥 Mis equipos</h1>
                    <p style={styles.subtitle}>
                      Consulta los equipos a los que perteneces.
                    </p>

                    <div style={styles.topActionRow}>
                      <button
                        type="button"
                        style={styles.actionButton}
                        onClick={() => navigate("/equipos/crear")}
                        onMouseEnter={handleDarkMouseEnter}
                        onMouseLeave={handleDarkMouseLeave}
                      >
                        Crear equipo
                      </button>
                    </div>

                    <div style={styles.filtersBar}>
                      <div style={{ ...styles.filterBox, ...styles.searchBox }}>
                        <span style={styles.filterIcon}>🔎</span>
                        <input
                          type="text"
                          placeholder="Buscar por nombre, descripción o rol..."
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
                              {estado === "activo" ? "Activo" : "Inactivo"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.filterBox}>
                        <span style={styles.filterIcon}>🏅</span>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Todos los roles</option>
                          {roles.map((rol) => (
                            <option key={rol} value={rol}>
                              {formatRol(rol)}
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
                        <h2 style={styles.sectionTitle}>Resumen de equipos</h2>
                      </div>

                      <div style={styles.kpiGrid}>
                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Total</p>
                          <h3 style={styles.kpiValue}>{resumen.total}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Activos</p>
                          <h3 style={styles.kpiValue}>{resumen.activos}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Inactivos</p>
                          <h3 style={styles.kpiValue}>{resumen.inactivos}</h3>
                        </div>

                        <div style={styles.kpiCard}>
                          <p style={styles.kpiLabel}>Capitán</p>
                          <h3 style={styles.kpiValue}>{resumen.liderados}</h3>
                        </div>
                      </div>
                    </section>

                    <section style={styles.nextCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Equipo destacado</h2>
                      </div>

                      {primerEquipo ? (
                        <>
                          <div style={styles.highlightIdentity}>
                            <div style={styles.highlightAvatar}>
                              {getTeamInitials(primerEquipo.nombre_equipo)}
                            </div>
                            <div style={styles.highlightInfo}>
                              <p style={styles.nextName}>{primerEquipo.nombre_equipo}</p>
                              <p style={styles.nextLine}>
                                🏅 {formatRol(primerEquipo.rol_equipo)}
                              </p>
                            </div>
                          </div>

                          <p style={styles.nextLine}>
                            👥 {primerEquipo.miembros?.length || 0} miembros
                          </p>
                          <p style={styles.nextLine}>
                            📝 {primerEquipo.descripcion || "Sin descripción"}
                          </p>

                          <div style={styles.nextBadgeWrap}>
                            <span
                              style={{
                                ...styles.sideStatus,
                                background: primerEquipo.activo ? GREEN : SLATE,
                              }}
                            >
                              {formatEstadoEquipo(primerEquipo.activo)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p style={styles.emptyTextSmall}>
                          No perteneces a ningún equipo todavía.
                        </p>
                      )}
                    </section>
                  </div>

                  {!filteredEquipos.length ? (
                    <div style={styles.emptyBox}>
                      <p style={styles.emptyText}>
                        No encontramos equipos con esos filtros.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.grid}>
                      {paginatedEquipos.map((equipo) => (
                        <article key={equipo.id} style={styles.card}>
                          <div style={styles.cardBody}>
                            <div style={styles.cardTopRow}>
                              <div style={styles.teamIdentity}>
                                <div style={styles.teamAvatar}>
                                  {getTeamInitials(equipo.nombre_equipo)}
                                </div>

                                <div style={styles.teamInfo}>
                                  <h2 style={styles.cardTitle}>
                                    {equipo.nombre_equipo}
                                  </h2>
                                  <p style={styles.teamRole}>
                                    {formatRol(equipo.rol_equipo)}
                                  </p>
                                </div>
                              </div>

                              <span
                                style={{
                                  ...styles.estadoBadge,
                                  background: equipo.activo ? GREEN : SLATE,
                                }}
                              >
                                {formatEstadoEquipo(equipo.activo)}
                              </span>
                            </div>

                            <div style={styles.infoGrid}>
                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Miembros</span>
                                <span style={styles.infoValue}>
                                  {equipo.miembros?.length || 0}
                                </span>
                              </div>

                              <div style={styles.infoBox}>
                                <span style={styles.infoLabel}>Estado</span>
                                <span style={styles.infoValue}>
                                  {formatEstadoEquipo(equipo.activo)}
                                </span>
                              </div>
                            </div>

                            <div style={styles.noteBox}>
                              <span style={styles.infoLabel}>Descripción</span>
                              <p style={styles.noteText}>
                                {equipo.descripcion || "Sin descripción"}
                              </p>
                            </div>

                            <div style={styles.actions}>
                              <button
                                type="button"
                                style={styles.primaryButton}
                                onClick={() => navigate(`/equipos/${equipo.id}`)}
                                onMouseEnter={handlePrimaryMouseEnter}
                                onMouseLeave={handlePrimaryMouseLeave}
                              >
                                Ver detalle
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
                      <span style={styles.featureIcon}>👥</span>
                      <span style={styles.featureText}>Equipos creados</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>🏅</span>
                      <span style={styles.featureText}>Roles definidos</span>
                    </div>

                    <div style={styles.featureItem}>
                      <span style={styles.featureIcon}>⚽</span>
                      <span style={styles.featureText}>Comunidad activa</span>
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

  topActionRow: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "12px",
  },

  actionButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(15,23,42,0.24)",
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

  nextName: {
    margin: "0 0 4px",
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
    wordBreak: "break-word",
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

  teamIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
    flex: 1,
  },

  teamAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "999px",
    background: "#e2e8f0",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "17px",
    flexShrink: 0,
  },

  teamInfo: {
    minWidth: 0,
  },

  cardTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.15,
    wordBreak: "break-word",
  },

  teamRole: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
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