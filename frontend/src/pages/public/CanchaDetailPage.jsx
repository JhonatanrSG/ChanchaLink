import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";

const BACKEND_URL = "http://127.0.0.1:8000";
const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const BLOCKS_PER_PAGE = 3;
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

  return "Capacidad no definida";
}

function formatPrice(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString("es-CO")}`;
}

function formatDateLabel(fecha) {
  if (!fecha) return "Sin fecha";
  const date = new Date(`${fecha}T00:00:00`);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
}

export default function CanchaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cancha, setCancha] = useState(null);
  const [fecha, setFecha] = useState("");
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [blocksPage, setBlocksPage] = useState(1);

  const [guestForm, setGuestForm] = useState({
    nombre_contacto: "",
    correo_contacto: "",
    celular_contacto: "",
    cedula_contacto: "",
  });

  const [loadingCancha, setLoadingCancha] = useState(true);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [loadingReserva, setLoadingReserva] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCancha = async () => {
      try {
        const response = await api.get(`/canchas/${id}/`);
        setCancha(response.data);
      } catch (err) {
        console.error("ERROR DETALLE CANCHA:", err);
        setError("No fue posible cargar la información de la cancha.");
      } finally {
        setLoadingCancha(false);
      }
    };

    fetchCancha();
  }, [id]);

  const handleBuscarDisponibilidad = async () => {
    if (!fecha) {
      setError("Debes seleccionar una fecha.");
      return;
    }

    setError("");
    setSuccess("");
    setSelectedBlocks([]);
    setBlocksPage(1);
    setLoadingDisponibilidad(true);

    try {
      const response = await api.get(`/canchas/${id}/disponibilidad/?fecha=${fecha}`);
      setDisponibilidad(response.data);
    } catch (err) {
      console.error("ERROR DISPONIBILIDAD:", err);
      setError("No fue posible consultar la disponibilidad.");
      setDisponibilidad(null);
    } finally {
      setLoadingDisponibilidad(false);
    }
  };

  const isConsecutiveSelection = (blocks) => {
    if (blocks.length <= 1) return true;

    const sorted = [...blocks].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio)
    );

    for (let i = 0; i < sorted.length - 1; i += 1) {
      if (sorted[i].hora_fin !== sorted[i + 1].hora_inicio) {
        return false;
      }
    }

    return true;
  };

  const toggleBlock = (bloque) => {
    setError("");
    setSuccess("");

    const exists = selectedBlocks.some(
      (item) =>
        item.hora_inicio === bloque.hora_inicio &&
        item.hora_fin === bloque.hora_fin
    );

    let updated;

    if (exists) {
      updated = selectedBlocks.filter(
        (item) =>
          !(
            item.hora_inicio === bloque.hora_inicio &&
            item.hora_fin === bloque.hora_fin
          )
      );
      setSelectedBlocks(updated);
      return;
    }

    updated = [...selectedBlocks, bloque];

    if (updated.length > 2) {
      setError("Solo puedes seleccionar máximo 2 bloques.");
      return;
    }

    if (!isConsecutiveSelection(updated)) {
      setError("Solo puedes seleccionar bloques consecutivos.");
      return;
    }

    setSelectedBlocks(updated);
  };

  const selectionSummary = useMemo(() => {
    if (selectedBlocks.length === 0) {
      return {
        hora_inicio: null,
        hora_fin: null,
        total: 0,
      };
    }

    const sorted = [...selectedBlocks].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio)
    );

    const total = sorted.reduce(
      (acc, bloque) => acc + Number(bloque.valor),
      0
    );

    return {
      hora_inicio: sorted[0].hora_inicio,
      hora_fin: sorted[sorted.length - 1].hora_fin,
      total,
    };
  }, [selectedBlocks]);

  const handleGuestChange = (e) => {
  const { name, value } = e.target;

  let sanitizedValue = value;

  if (name === "celular_contacto" || name === "cedula_contacto") {
    sanitizedValue = value.replace(/\D/g, "");
  }

  if (name === "nombre_contacto") {
    sanitizedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  }

  setGuestForm((prev) => ({
    ...prev,
    [name]: sanitizedValue,
  }));
};

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.correo_contacto);
  const celularIsValid = guestForm.celular_contacto.trim().length >= 10;
  const cedulaIsValid = guestForm.cedula_contacto.trim().length >= 6;

  const isGuestFormValid =
    guestForm.nombre_contacto.trim().length >= 3 &&
    emailIsValid &&
    celularIsValid &&
    cedulaIsValid;

  const handleReservar = async () => {
    if (!fecha || selectedBlocks.length === 0) {
      setError("Debes seleccionar una fecha y al menos un bloque.");
      return;
    }

    if (!isAuthenticated && !isGuestFormValid) {
      setError(
      "Completa correctamente los datos del visitante: nombre, correo válido, celular y cédula."
    );
      return;
    }

    setError("");
    setSuccess("");
    setLoadingReserva(true);

    try {
      const basePayload = {
        cancha: Number(id),
        fecha_reserva: fecha,
        hora_inicio: selectionSummary.hora_inicio,
        hora_fin: selectionSummary.hora_fin,
      };

      let response;

      if (isAuthenticated) {
        response = await api.post("/reservas/", basePayload);
      } else {
        response = await api.post("/reservas/guest/", {
          ...basePayload,
          ...guestForm,
        });
      }

      setSuccess(
        `Reserva confirmada correctamente. Total: ${formatPrice(response.data.precio_final)}`
      );
      setSelectedBlocks([]);

      if (!isAuthenticated) {
        setGuestForm({
          nombre_contacto: "",
          correo_contacto: "",
          celular_contacto: "",
          cedula_contacto: "",
        });
      }

      await handleBuscarDisponibilidad();

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("ERROR RESERVA:", err?.response?.data || err);

      if (err?.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (typeof err?.response?.data === "string") {
        setError(err.response.data);
      } else {
        setError("No fue posible completar la reserva.");
      }
    } finally {
      setLoadingReserva(false);
    }
  };

  const isBlockSelected = (bloque) =>
    selectedBlocks.some(
      (item) =>
        item.hora_inicio === bloque.hora_inicio &&
        item.hora_fin === bloque.hora_fin
    );

  const totalBlockPages = Math.max(
    1,
    Math.ceil((disponibilidad?.bloques?.length || 0) / BLOCKS_PER_PAGE)
  );

  const visibleBlocks = useMemo(() => {
    if (!disponibilidad?.bloques) return [];
    const start = (blocksPage - 1) * BLOCKS_PER_PAGE;
    const end = start + BLOCKS_PER_PAGE;
    return disponibilidad.bloques.slice(start, end);
  }, [disponibilidad, blocksPage]);

  const goPrevBlocks = () => {
    setBlocksPage((prev) => Math.max(1, prev - 1));
  };

  const goNextBlocks = () => {
    setBlocksPage((prev) => Math.min(totalBlockPages, prev + 1));
  };

  const handleButtonMouseEnter = (e) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.background = ORANGE;
    }
  };

  const handleButtonMouseLeave = (e) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.background = GREEN;
    }
  };

  return (
    <MainLayout>
      {loadingCancha ? (
        <div style={styles.page}>
          <div style={styles.overlay}>
            <p style={styles.statusText}>Cargando cancha...</p>
          </div>
        </div>
      ) : cancha ? (
        <div style={styles.page}>
          <div style={styles.overlay}>
            <div style={styles.container}>
              <h1 style={styles.pageTitle}>⚽ Calendario de reservas</h1>

              <div style={styles.topLayout}>
                <div style={styles.mainPanel}>
                  <div style={styles.canchaHeader}>
                    <div style={styles.imageBox}>
                      <img
                        src={getImageOrFallback(cancha.imagen)}
                        alt={cancha.nombre}
                        style={styles.image}
                      />
                    </div>

                    <div style={styles.info}>
                      <h2 style={styles.title}>{cancha.nombre}</h2>

                      <p style={styles.locationText}>
                        📍 {cancha.ubicacion || "Ubicación no disponible"}
                      </p>

                      <div style={styles.infoMeta}>
                        <span style={styles.infoBadge}>👥 {formatCapacidad(cancha)}</span>
                        <span style={styles.infoBadge}>⚽ {formatTipoFutbol(cancha.tipo_futbol)}</span>
                      </div>

                      <div style={styles.infoMeta}>
                        <span style={styles.ratingBadge}>★ 4.8 (120)</span>
                        <span style={styles.companyBadge}>
                          {cancha.empresa_nombre || "CanchaLink"}
                        </span>
                      </div>

                      <p style={styles.description}>
                        {cancha.descripcion || "Cancha disponible para reserva."}
                      </p>
                    </div>
                  </div>

                  <div style={styles.searchBox}>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      style={styles.input}
                    />

                    <button
                      onClick={handleBuscarDisponibilidad}
                      style={styles.button}
                      onMouseEnter={handleButtonMouseEnter}
                      onMouseLeave={handleButtonMouseLeave}
                    >
                      Consultar
                    </button>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}
                  {loadingDisponibilidad && (
                    <p style={styles.statusText}>Cargando disponibilidad...</p>
                  )}

                  {disponibilidad && (
                    <div style={styles.blocksContainer}>
                      <h3 style={styles.sectionSubtitle}>
                        Bloques disponibles para {disponibilidad.fecha}
                      </h3>

                      {disponibilidad.bloques.length === 0 ? (
                        <p style={styles.statusText}>
                          No hay bloques configurados para esta fecha.
                        </p>
                      ) : (
                        <>
                          <div style={styles.blocksTable}>
                            {visibleBlocks.map((bloque, index) => {
                              const disponible = bloque.estado === "disponible";
                              const selected = isBlockSelected(bloque);

                              return (
                                <button
                                  key={`${bloque.hora_inicio}-${bloque.hora_fin}-${index}`}
                                  type="button"
                                  disabled={!disponible}
                                  onClick={() => disponible && toggleBlock(bloque)}
                                  style={{
                                    ...styles.blockRow,
                                    ...(disponible ? styles.blockAvailable : styles.blockOccupied),
                                    ...(selected ? styles.blockSelected : {}),
                                  }}
                                >
                                  <div style={styles.blockHour}>
                                    {bloque.hora_inicio} - {bloque.hora_fin}
                                  </div>

                                  <div style={styles.blockMiddle}>
                                    <span style={styles.blockStateText}>
                                      {selected
                                        ? "🟡 Seleccionado"
                                        : disponible
                                        ? "🟢 Disponible"
                                        : "🔴 Ocupado"}
                                    </span>
                                    <span style={styles.blockPrice}>
                                      {formatPrice(bloque.valor)}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      ...styles.blockStatusBadge,
                                      ...(disponible
                                        ? selected
                                          ? styles.badgeSelected
                                          : styles.badgeAvailable
                                        : styles.badgeOccupied),
                                    }}
                                  >
                                    {selected
                                      ? "Seleccionado"
                                      : disponible
                                      ? "Disponible"
                                      : "Ocupado"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {totalBlockPages > 1 && (
                            <div style={styles.blocksPagination}>
                              <button
                                type="button"
                                onClick={goPrevBlocks}
                                disabled={blocksPage === 1}
                                style={{
                                  ...styles.navButton,
                                  opacity: blocksPage === 1 ? 0.45 : 1,
                                  cursor: blocksPage === 1 ? "default" : "pointer",
                                }}
                              >
                                ‹
                              </button>

                              <span style={styles.navText}>
                                {blocksPage} / {totalBlockPages}
                              </span>

                              <button
                                type="button"
                                onClick={goNextBlocks}
                                disabled={blocksPage === totalBlockPages}
                                style={{
                                  ...styles.navButton,
                                  opacity: blocksPage === totalBlockPages ? 0.45 : 1,
                                  cursor:
                                    blocksPage === totalBlockPages ? "default" : "pointer",
                                }}
                              >
                                ›
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <aside style={styles.summaryPanel}>
                  <h3 style={styles.summaryTitle}>Resumen de reserva</h3>

                  <div style={styles.summaryGroup}>
                    <p style={styles.summaryText}>
                      <strong>Cancha:</strong> {cancha.nombre}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Fecha:</strong> {fecha ? formatDateLabel(fecha) : "--"}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Hora:</strong>{" "}
                      {selectionSummary.hora_inicio && selectionSummary.hora_fin
                        ? `${selectionSummary.hora_inicio} - ${selectionSummary.hora_fin}`
                        : "--"}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Tipo:</strong> {formatTipoFutbol(cancha.tipo_futbol)}
                    </p>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.summaryPriceRow}>
                    <span style={styles.summaryPriceLabel}>Precio</span>
                    <span style={styles.summaryPrice}>
                      {formatPrice(selectionSummary.total || 0)}
                    </span>
                  </div>

                  {!isAuthenticated && (
                    <div style={styles.guestBox}>
                      <h4 style={styles.guestTitle}>Reserva como visitante</h4>

                      <input
                      type="text"
                      name="nombre_contacto"
                      placeholder="Nombre completo del contacto"
                      value={guestForm.nombre_contacto}
                      onChange={handleGuestChange}
                      style={styles.guestInput}
                    />

                    <input
                      type="email"
                      name="correo_contacto"
                      placeholder="Correo electrónico"
                      value={guestForm.correo_contacto}
                      onChange={handleGuestChange}
                      style={styles.guestInput}
                    />

                    <input
                      type="tel"
                      name="celular_contacto"
                      placeholder="Número de celular"
                      value={guestForm.celular_contacto}
                      onChange={handleGuestChange}
                      style={styles.guestInput}
                    />

                    <input
                      type="text"
                      name="cedula_contacto"
                      placeholder="Número de cédula"
                      value={guestForm.cedula_contacto}
                      onChange={handleGuestChange}
                      style={styles.guestInput}
                    />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleReservar}
                    style={{
                      ...styles.reserveButton,
                      opacity:
                        loadingReserva ||
                        selectedBlocks.length === 0 ||
                        (!isAuthenticated && !isGuestFormValid)
                          ? 0.65
                          : 1,
                      cursor:
                        loadingReserva ||
                        selectedBlocks.length === 0 ||
                        (!isAuthenticated && !isGuestFormValid)
                          ? "default"
                          : "pointer",
                    }}
                    disabled={
                      loadingReserva ||
                      selectedBlocks.length === 0 ||
                      (!isAuthenticated && !isGuestFormValid)
                    }
                    onMouseEnter={handleButtonMouseEnter}
                    onMouseLeave={handleButtonMouseLeave}
                  >
                    {loadingReserva
                      ? "Reservando..."
                      : isAuthenticated
                      ? "Reservar ahora"
                      : "Reservar como visitante"}
                  </button>
                </aside>
              </div>

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
      ) : (
        <div style={styles.page}>
          <div style={styles.overlay}>
            <p style={styles.statusText}>No se encontró la cancha.</p>
          </div>
        </div>
      )}
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

  pageTitle: {
    margin: "8px 0 18px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  topLayout: {
    display: "grid",
    gridTemplateColumns: "2fr 0.9fr",
    gap: "18px",
    alignItems: "start",
  },

  mainPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 14px 30px rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.45)",
  },

  summaryPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 14px 30px rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.45)",
    position: "sticky",
    top: "78px",
  },

  canchaHeader: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "16px",
    marginBottom: "16px",
  },

  imageBox: {
    width: "100%",
    height: "170px",
    borderRadius: "12px",
    background: "#dbe3ee",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 900,
  },

  locationText: {
    margin: 0,
    fontSize: "14px",
    color: "#475569",
    fontWeight: 600,
  },

  infoMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  infoBadge: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 700,
  },

  ratingBadge: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 800,
  },

  companyBadge: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
  },

  description: {
    margin: "4px 0 0",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#334155",
  },

  searchBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "14px",
  },

  input: {
  height: "46px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
  WebkitTextFillColor: "#0f172a",
  },

  button: {
    border: "none",
    borderRadius: "10px",
    padding: "0 18px",
    height: "46px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(34,197,94,0.20)",
    transition: "all 0.2s ease",
  },

  error: {
    color: "#dc2626",
    marginBottom: "12px",
    fontWeight: 700,
  },

  success: {
    color: "#16a34a",
    marginBottom: "12px",
    fontWeight: 700,
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "15px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  blocksContainer: {
    marginTop: "12px",
  },

  sectionSubtitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  blocksTable: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minHeight: "242px",
  },

  blockRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "180px 1fr 150px",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    textAlign: "left",
  },

  blockAvailable: {
    background: "#f8fafc",
    cursor: "pointer",
  },

  blockOccupied: {
    background: "#fff1f2",
    cursor: "not-allowed",
    opacity: 0.85,
  },

  blockSelected: {
    outline: "2px solid #eab308",
    background: "#fffbeb",
  },

  blockHour: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#0f172a",
  },

  blockMiddle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  blockStateText: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#334155",
  },

  blockPrice: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#475569",
  },

  blockStatusBadge: {
    justifySelf: "end",
    minWidth: "120px",
    textAlign: "center",
    padding: "10px 12px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#ffffff",
  },

  badgeAvailable: {
    background: GREEN,
  },

  badgeOccupied: {
    background: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
  },

  badgeSelected: {
    background: ORANGE,
  },

  blocksPagination: {
    marginTop: "14px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },

  navButton: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "22px",
    lineHeight: 1,
  },

  navText: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#334155",
    minWidth: "70px",
    textAlign: "center",
  },

  summaryTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  summaryGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  summaryText: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.5,
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "14px 0",
  },

  summaryPriceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  summaryPriceLabel: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#334155",
  },

  summaryPrice: {
    fontSize: "24px",
    fontWeight: 900,
    color: "#0f172a",
  },

  guestBox: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  guestTitle: {
    margin: "0 0 2px",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 800,
  },

  guestInput: {
  height: "44px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
  WebkitTextFillColor: "#0f172a",
  },

  reserveButton: {
    marginTop: "16px",
    width: "100%",
    border: "none",
    borderRadius: "12px",
    padding: "14px 16px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "16px",
    boxShadow: "0 10px 20px rgba(34,197,94,0.22)",
    transition: "all 0.2s ease",
  },

  featuresRow: {
    marginTop: "24px",
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