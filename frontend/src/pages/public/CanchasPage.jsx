import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import MainLayout from "../../components/layout/MainLayout";

const BACKEND_URL = "http://127.0.0.1:8000";
const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const ITEMS_PER_PAGE = 6;

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Tipo no definido";

  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);

  if (!isNaN(numero)) {
    return `Fútbol ${numero}`;
  }

  return tipo;
}

function formatCapacidad(cancha) {
  if (cancha?.capacidad_jugadores) {
    return `${cancha.capacidad_jugadores} jugadores`;
  }

  const tipo = cancha?.tipo_futbol?.toLowerCase()?.replace("futbol_", "");
  const numero = parseInt(tipo, 10);

  if (!isNaN(numero)) {
    return `${numero * 2} jugadores`;
  }

  return "Capacidad no definida";
}

export default function CanchasPage() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const response = await api.get("/canchas/");
        setCanchas(response.data);
      } catch (err) {
        console.error("ERROR CARGANDO CANCHAS:", err);
        setError("No fue posible cargar las canchas.");
      } finally {
        setLoading(false);
      }
    };

    fetchCanchas();
  }, []);

  const cities = useMemo(() => {
    return Array.from(
      new Set(canchas.map((cancha) => cancha.ubicacion?.trim()).filter(Boolean))
    );
  }, [canchas]);

  const footballTypes = useMemo(() => {
    return Array.from(
      new Set(canchas.map((cancha) => cancha.tipo_futbol?.trim()).filter(Boolean))
    );
  }, [canchas]);

  const filteredCanchas = useMemo(() => {
    return canchas.filter((cancha) => {
      const matchesSearch =
        !search ||
        cancha.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        cancha.ubicacion?.toLowerCase().includes(search.toLowerCase()) ||
        cancha.empresa_nombre?.toLowerCase().includes(search.toLowerCase());

      const matchesCity = !cityFilter || cancha.ubicacion === cityFilter;
      const matchesType = !typeFilter || cancha.tipo_futbol === typeFilter;

      return matchesSearch && matchesCity && matchesType;
    });
  }, [canchas, search, cityFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, cityFilter, typeFilter]);

  const totalPages = Math.ceil(filteredCanchas.length / ITEMS_PER_PAGE);

  const paginatedCanchas = filteredCanchas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.container}>
            <div style={styles.heroBlock}>
              <h1 style={styles.title}>⚽ Encuentra tu cancha</h1>

              <div style={styles.filtersBar}>
                <div style={{ ...styles.filterBox, ...styles.searchBox }}>
                  <span style={styles.filterIcon}>🔎</span>
                  <input
                    type="text"
                    placeholder="Buscar cancha o ubicación..."
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
                    <option value="">Todos los tipos</option>
                    {footballTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatTipoFutbol(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading && <p style={styles.statusText}>Cargando canchas...</p>}
            {error && <p style={styles.error}>{error}</p>}

            {!loading && !error && (
              <>
                <div style={styles.grid}>
                  {paginatedCanchas.map((cancha) => (
                    <div key={cancha.id} style={styles.card}>
                      <div style={styles.imageWrapper}>
                        <img
                          src={getImageOrFallback(cancha.imagen)}
                          alt={cancha.nombre}
                          style={styles.image}
                        />
                      </div>

                      <div style={styles.cardBody}>
                        <h2 style={styles.cardTitle}>{cancha.nombre}</h2>

                        <p style={styles.locationRow}>
                          📍 {cancha.ubicacion || "Ubicación no disponible"}
                        </p>

                        <div style={styles.metaRow}>
                          <span style={styles.metaItem}>
                            👥 {formatCapacidad(cancha)}
                          </span>
                          <span style={styles.metaItem}>
                            ⚽ {formatTipoFutbol(cancha.tipo_futbol)}
                          </span>
                        </div>

                        <div style={styles.footerRow}>
                          <div style={styles.rating}>
                            <span style={styles.star}>★</span>
                            <span>4.8</span>
                            <span style={styles.ratingCount}>
                              ({cancha.id ? 90 + cancha.id : 120})
                            </span>
                          </div>

                          <div style={styles.companyText}>
                            {cancha.empresa_nombre || "CanchaLink"}
                          </div>
                        </div>

                        <Link to={`/canchas/${cancha.id}`} style={styles.button}>
                          Ver disponibilidad
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {!paginatedCanchas.length && (
                  <p style={styles.statusText}>
                    No encontramos canchas con esos filtros.
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
    maxWidth: "1080px",
    margin: "0 auto",
  },

  heroBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: "6px 0 16px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  filtersBar: {
    width: "100%",
    maxWidth: "900px",
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
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: 700,
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "15px",
    marginBottom: "18px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "22px",
  },

  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  imageWrapper: {
    width: "100%",
    height: "140px",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#dbe4ee",
    marginBottom: "8px",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  cardBody: {
    display: "flex",
    flexDirection: "column",
  },

  cardTitle: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1.15,
  },

  locationRow: {
    margin: "0 0 8px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    color: "#475569",
    fontSize: "13px",
    flexWrap: "wrap",
  },

  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: 600,
  },

  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  rating: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
  },

  star: {
    color: "#fbbf24",
    fontSize: "16px",
    lineHeight: 1,
  },

  ratingCount: {
    color: "#64748b",
    fontWeight: 500,
  },

  companyText: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 700,
    textAlign: "right",
  },

  button: {
    marginTop: "auto",
    background: "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)",
    color: "#ffffff",
    padding: "10px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: 800,
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 8px 16px rgba(34,197,94,0.22)",
  },

  pagination: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
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