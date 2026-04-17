import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import MainLayout from "../../components/layout/MainLayout";

const BACKEND_URL = "http://127.0.0.1:8000";
const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const ITEMS_PER_PAGE = 6;
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Fútbol";
  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);

  if (!isNaN(numero)) {
    return `Fútbol ${numero}`;
  }

  return tipo;
}

function formatNivel(nivel) {
  if (nivel === "recreativo") return "Recreativo";
  if (nivel === "intermedio") return "Intermedio";
  if (nivel === "competitivo") return "Competitivo";
  return nivel || "Sin nivel";
}

function formatFecha(fecha) {
  if (!fecha) return "Sin fecha";

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

function getPartidoUbicacion(partido) {
  return (
    partido.cancha_ubicacion ||
    partido.ubicacion ||
    partido.cancha?.ubicacion ||
    partido.reserva?.cancha_ubicacion ||
    partido.reserva?.ubicacion ||
    partido.reserva_detalle?.cancha_ubicacion ||
    partido.reserva_detalle?.ubicacion ||
    ""
  );
}

function getPartidoTipoFutbol(partido) {
  return (
    partido.cancha_tipo_futbol ||
    partido.tipo_futbol ||
    partido.cancha?.tipo_futbol ||
    partido.reserva?.cancha_tipo_futbol ||
    partido.reserva?.tipo_futbol ||
    partido.reserva_detalle?.cancha_tipo_futbol ||
    partido.reserva_detalle?.tipo_futbol ||
    ""
  );
}

function getPartidoImagen(partido) {
  return (
    partido.cancha_imagen ||
    partido.imagen ||
    partido.cancha?.imagen ||
    partido.reserva?.cancha_imagen ||
    partido.reserva?.imagen ||
    partido.reserva_detalle?.cancha_imagen ||
    ""
  );
}

function getCapacidadTexto(partido) {
  const actuales = Number(partido.jugadores_actuales || 0);
  const faltantes = Number(partido.jugadores_faltantes || 0);
  const total = actuales + faltantes;

  if (total > 0) {
    return `${actuales}/${total}`;
  }

  return "0/0";
}

export default function PartidosPage() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const response = await api.get("/partidos/");
        setPartidos(response.data);
      } catch (err) {
        console.error("ERROR CARGANDO PARTIDOS:", err);
        setError("No fue posible cargar los partidos.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, []);

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        partidos
          .map((partido) => getPartidoUbicacion(partido)?.trim())
          .filter(Boolean)
      )
    );
  }, [partidos]);

  const footballTypes = useMemo(() => {
    return Array.from(
      new Set(
        partidos
          .map((partido) => getPartidoTipoFutbol(partido)?.trim())
          .filter(Boolean)
      )
    );
  }, [partidos]);

  const filteredPartidos = useMemo(() => {
    return partidos.filter((partido) => {
      const ubicacion = getPartidoUbicacion(partido);
      const tipoFutbol = getPartidoTipoFutbol(partido);

      const matchesSearch =
        !search ||
        partido.cancha_nombre?.toLowerCase().includes(search.toLowerCase()) ||
        ubicacion?.toLowerCase().includes(search.toLowerCase());

      const matchesCity = !cityFilter || ubicacion === cityFilter;
      const matchesType = !typeFilter || tipoFutbol === typeFilter;

      return matchesSearch && matchesCity && matchesType;
    });
  }, [partidos, search, cityFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, cityFilter, typeFilter]);

  const totalPages = Math.ceil(filteredPartidos.length / ITEMS_PER_PAGE);

  const paginatedPartidos = filteredPartidos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleLinkMouseEnter = (e) => {
    e.currentTarget.style.background = ORANGE;
  };

  const handleLinkMouseLeave = (e) => {
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.container}>
            <div style={styles.heroBlock}>
              <h1 style={styles.title}>⚽ Partidos disponibles</h1>
              <p style={styles.subtitle}>
                Encuentra partidos abiertos y únete a jugar
              </p>

              <div style={styles.filtersRow}>
                <div style={{ ...styles.filterBox, ...styles.searchBox }}>
                  <span style={styles.filterIcon}>🔎</span>
                  <input
                    type="text"
                    placeholder="Buscar cancha o zona..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <div style={styles.filterBox}>
                  <span style={styles.filterIcon}>📍</span>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Todas las ciudades</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterBox}>
                  <span style={styles.filterIcon}>⚽</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Todos</option>
                    {footballTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatTipoFutbol(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading && <p style={styles.statusText}>Cargando partidos...</p>}
            {error && <p style={styles.error}>{error}</p>}

            {!loading && !error && (
              <>
                <div style={styles.list}>
                  {paginatedPartidos.map((partido) => {
                    const ubicacion = getPartidoUbicacion(partido);
                    const tipoFutbol = getPartidoTipoFutbol(partido);

                    return (
                      <div key={partido.id} style={styles.card}>
                        <div style={styles.imageBox}>
                          <img
                            src={getImageOrFallback(getPartidoImagen(partido))}
                            alt={partido.cancha_nombre}
                            style={styles.image}
                          />
                        </div>

                        <div style={styles.cardContent}>
                          <div style={styles.cardTop}>
                            <div>
                              <h2 style={styles.cardTitle}>{partido.cancha_nombre}</h2>
                              <p style={styles.locationText}>
                                📍 {ubicacion || "Ubicación no disponible"}
                              </p>
                            </div>

                            <span style={styles.cityBadge}>
                              {partido.empresa_nombre || "CanchaLink"}
                            </span>
                          </div>

                          <div style={styles.metaGrid}>
                            <span style={styles.metaItem}>
                              🕒 {normalizeHora(partido.hora_inicio)} - {normalizeHora(partido.hora_fin)}
                            </span>

                            <span style={styles.metaItem}>
                              ⚽ {formatTipoFutbol(tipoFutbol)}
                            </span>

                            <span style={styles.metaItem}>
                              🟡 {formatNivel(partido.nivel_partido)}
                            </span>

                            <span style={styles.metaItem}>
                              👥 {getCapacidadTexto(partido)}
                            </span>
                          </div>

                          <div style={styles.bottomRow}>
                            <p style={styles.dateText}>
                              {formatFecha(partido.fecha_reserva)}
                            </p>

                            <Link
                              to={`/partidos/${partido.id}`}
                              style={styles.button}
                              onMouseEnter={handleLinkMouseEnter}
                              onMouseLeave={handleLinkMouseLeave}
                            >
                              Postularme
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!paginatedPartidos.length && (
                  <p style={styles.statusText}>
                    No encontramos partidos con esos filtros.
                  </p>
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
                            background: isActive ? "#1ea133" : "rgba(255,255,255,0.10)",
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
              </>
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
    padding: "24px 24px 34px",
    background: "linear-gradient(rgba(3,10,24,0.24), rgba(3,10,24,0.34))",
  },

  container: {
    width: "100%",
    maxWidth: "1120px",
    margin: "0 auto",
  },

  heroBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
  },

  title: {
    margin: "8px 0 4px",
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  subtitle: {
    margin: "0 0 18px",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 500,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  filtersRow: {
    width: "100%",
    maxWidth: "920px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "12px",
    background: "rgba(255,255,255,0.94)",
    borderRadius: "16px",
    padding: "10px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.35)",
  },

  filterBox: {
    height: "52px",
    borderRadius: "12px",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  searchBox: {
    paddingRight: "12px",
  },

  filterIcon: {
    width: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#16a34a",
    flexShrink: 0,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "16px",
    color: "#334155",
  },

  select: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "16px",
    color: "#334155",
    cursor: "pointer",
    paddingRight: "12px",
  },

  error: {
    color: "#fecaca",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: 700,
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "16px",
    marginBottom: "18px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  list: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  card: {
    display: "grid",
    gridTemplateColumns: "170px 1fr",
    gap: "14px",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "16px",
    padding: "12px",
    border: "1px solid rgba(255,255,255,0.40)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
    alignItems: "center",
  },

  imageBox: {
    width: "100%",
    height: "120px",
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

  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  cardTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1.15,
  },

  locationText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
  },

  cityBadge: {
    background: "#e5e7eb",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    borderRadius: "999px",
    padding: "6px 10px",
    whiteSpace: "nowrap",
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 12px",
  },

  metaItem: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  },

  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "2px",
  },

  dateText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 700,
  },

  button: {
    minWidth: "160px",
    background: GREEN,
    color: "#ffffff",
    padding: "11px 14px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: 800,
    fontSize: "15px",
    textDecoration: "none",
    boxShadow: "0 8px 16px rgba(34,197,94,0.22)",
    transition: "all 0.2s ease",
  },

  pagination: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
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