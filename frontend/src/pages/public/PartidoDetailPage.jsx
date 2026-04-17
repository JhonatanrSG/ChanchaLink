import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";

const BACKEND_URL = "http://127.0.0.1:8000";
const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
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

  if (!isNaN(numero)) return `Fútbol ${numero}`;
  return tipo;
}

function formatNivel(nivel) {
  if (nivel === "recreativo") return "Recreativo";
  if (nivel === "intermedio") return "Intermedio";
  if (nivel === "competitivo") return "Competitivo";
  return nivel || "Sin nivel";
}

function formatTipoPartido(tipo) {
  if (tipo === "publico") return "Público";
  if (tipo === "privado") return "Privado";
  return tipo || "Público";
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

function formatPosicion(posicion) {
  if (posicion === "arquero") return "Arquero";
  if (posicion === "defensa") return "Defensa";
  if (posicion === "medio") return "Medio";
  if (posicion === "delantero") return "Delantero";
  return posicion;
}

function getCapacidadTexto(partido) {
  const actuales = Number(partido.jugadores_actuales || 0);
  const faltantes = Number(partido.jugadores_faltantes || 0);
  const total = actuales + faltantes;

  if (total > 0) return `${actuales}/${total}`;
  return "0/0";
}

export default function PartidoDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [partido, setPartido] = useState(null);
  const [form, setForm] = useState({
    posicion_postulada: "",
    nota: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadingPostulacion, setLoadingPostulacion] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchPartido = async () => {
      try {
        const response = await api.get(`/partidos/${id}/`);
        setPartido(response.data);
      } catch (err) {
        console.error("ERROR DETALLE PARTIDO:", err);
        setError("No fue posible cargar el partido.");
      } finally {
        setLoading(false);
      }
    };

    fetchPartido();
  }, [id]);

  const posicionesDisponibles = useMemo(() => {
    if (!partido?.posiciones_necesarias?.length) {
      return [
        { value: "arquero", label: "Arquero" },
        { value: "defensa", label: "Defensa" },
        { value: "medio", label: "Medio" },
        { value: "delantero", label: "Delantero" },
      ];
    }

    return partido.posiciones_necesarias.map((pos) => ({
      value: pos.posicion,
      label: formatPosicion(pos.posicion),
      cantidad: pos.cantidad,
    }));
  }, [partido]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "nota") {
      sanitizedValue = value.slice(0, 180);
    }

    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handlePostularme = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("Debes iniciar sesión para postularte.");
      return;
    }

    if (!form.posicion_postulada) {
      setError("Selecciona la posición a la que deseas postularte.");
      return;
    }

    setError("");
    setSuccess("");
    setLoadingPostulacion(true);

    try {
      await api.post(`/partidos/${id}/postularme/`, form);
      setSuccess("Te postulaste correctamente al partido.");
      setForm({
        posicion_postulada: "",
        nota: "",
      });
    } catch (err) {
      console.error("ERROR POSTULACIÓN:", err?.response?.data || err);

      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError("No fue posible postularte al partido.");
      }
    } finally {
      setLoadingPostulacion(false);
    }
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
      {loading ? (
        <div style={styles.page}>
          <div style={styles.overlay}>
            <p style={styles.statusText}>Cargando partido...</p>
          </div>
        </div>
      ) : partido ? (
        <div style={styles.page}>
          <div style={styles.overlay}>
            <div style={styles.container}>
              <h1 style={styles.pageTitle}>⚽ Postularme al partido</h1>
              <p style={styles.pageSubtitle}>
                Revisa los detalles y confirma tu posición
              </p>

              <div style={styles.topLayout}>
                <div style={styles.mainPanel}>
                  <div style={styles.headerCard}>
                    <div style={styles.imageBox}>
                      <img
                        src={getImageOrFallback(partido.cancha_imagen)}
                        alt={partido.cancha_nombre}
                        style={styles.image}
                      />
                    </div>

                    <div style={styles.info}>
                      <div style={styles.infoTop}>
                        <div>
                          <h2 style={styles.title}>{partido.cancha_nombre}</h2>
                          <p style={styles.companyText}>
                            {partido.empresa_nombre || "CanchaLink"}
                          </p>
                          <p style={styles.locationText}>
                            📍 {partido.cancha_ubicacion || "Ubicación no disponible"}
                          </p>
                        </div>

                        <span style={styles.badge}>
                          {partido.empresa_nombre || "CanchaLink"}
                        </span>
                      </div>

                      <div style={styles.infoMeta}>
                        <span style={styles.infoBadge}>
                          🕒 {normalizeHora(partido.hora_inicio)} - {normalizeHora(partido.hora_fin)}
                        </span>
                        <span style={styles.infoBadge}>
                          ⚽ {formatTipoFutbol(partido.cancha_tipo_futbol)}
                        </span>
                        <span style={styles.infoBadge}>
                          🟡 {formatNivel(partido.nivel_partido)}
                        </span>
                        <span style={styles.infoBadge}>
                          👥 {getCapacidadTexto(partido)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.contentGrid}>
                    <div style={styles.detailsBox}>
                      <div style={styles.detailsGrid}>
                        <p style={styles.detailText}>
                          <strong>Fecha:</strong> {formatFecha(partido.fecha_reserva)}
                        </p>
                        <p style={styles.detailText}>
                          <strong>Hora:</strong> {normalizeHora(partido.hora_inicio)} - {normalizeHora(partido.hora_fin)}
                        </p>
                        <p style={styles.detailText}>
                          <strong>Tipo:</strong> {formatTipoPartido(partido.tipo_partido)}
                        </p>
                        <p style={styles.detailText}>
                          <strong>Nivel:</strong> {formatNivel(partido.nivel_partido)}
                        </p>
                        <p style={styles.detailText}>
                          <strong>Faltan:</strong> {partido.jugadores_faltantes} jugadores
                        </p>
                        <p style={styles.detailText}>
                          <strong>Estado:</strong> {partido.estado_partido || "abierto"}
                        </p>
                      </div>

                      <div style={styles.descriptionBox}>
                        <span style={styles.descriptionLabel}>Descripción</span>
                        <p style={styles.descriptionText}>
                          {partido.descripcion || "Partido abierto sin descripción adicional."}
                        </p>
                      </div>

                      <div style={styles.positionsBox}>
                        <h3 style={styles.positionsTitle}>Posiciones requeridas</h3>

                        <div style={styles.positionsRow}>
                          {partido.posiciones_necesarias?.length > 0 ? (
                            partido.posiciones_necesarias.map((pos) => (
                              <div key={pos.id} style={styles.positionChip}>
                                <span style={styles.positionChipText}>
                                  {formatPosicion(pos.posicion)} ({pos.cantidad})
                                </span>
                              </div>
                            ))
                          ) : (
                            <div style={styles.positionChip}>
                              <span style={styles.positionChipText}>
                                Sin posiciones registradas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={styles.formCard}>
                      <h2 style={styles.formTitle}>Confirmar postulación</h2>

                      <form onSubmit={handlePostularme} style={styles.form}>
                        <div style={styles.fieldGroup}>
                          <label style={styles.label}>Posición</label>
                          <select
                            name="posicion_postulada"
                            value={form.posicion_postulada}
                            onChange={handleChange}
                            style={styles.input}
                          >
                            <option value="">Selecciona una posición</option>
                            {posicionesDisponibles.map((pos) => (
                              <option key={pos.value} value={pos.value}>
                                {pos.label}
                                {pos.cantidad ? ` (${pos.cantidad})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.fieldGroup}>
                          <label style={styles.label}>Nota</label>
                          <textarea
                            name="nota"
                            value={form.nota}
                            onChange={handleChange}
                            placeholder="Cuéntale al creador por qué encajas en el partido"
                            style={styles.textarea}
                          />
                          <span style={styles.counterText}>
                            {form.nota.length} / 180
                          </span>
                        </div>

                        <button
                          type="submit"
                          style={styles.button}
                          disabled={loadingPostulacion}
                          onMouseEnter={handleButtonMouseEnter}
                          onMouseLeave={handleButtonMouseLeave}
                        >
                          {loadingPostulacion ? "Enviando..." : "Confirmar postulación"}
                        </button>
                      </form>

                      {error && <p style={styles.error}>{error}</p>}
                      {success && <p style={styles.success}>{success}</p>}
                    </div>
                  </div>
                </div>
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
            <p style={styles.statusText}>No se encontró el partido.</p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

const styles = {
  page: {
    height: "calc(100vh - 48px)",
    background: `url('${PAGE_BG}') center/cover no-repeat`,
    overflow: "hidden",
  },

  overlay: {
    height: "calc(100vh - 48px)",
    padding: "8px 14px 8px",
    background: "linear-gradient(rgba(3,10,24,0.22), rgba(3,10,24,0.30))",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "1020px",
    margin: "0 auto",
  },

  pageTitle: {
    margin: "0 0 2px",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  pageSubtitle: {
    margin: "0 0 6px",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  topLayout: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },

  mainPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "14px",
    padding: "8px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  headerCard: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "10px",
    alignItems: "center",
    paddingBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
  },

  imageBox: {
    width: "100%",
    height: "82px",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#dbe4ee",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  infoTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
  },

  title: {
    margin: "0 0 1px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 900,
    lineHeight: 1.1,
  },

  companyText: {
    margin: "0 0 2px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
  },

  locationText: {
    margin: 0,
    color: "#475569",
    fontSize: "11px",
    fontWeight: 600,
  },

  badge: {
    background: "#e8f7ee",
    color: "#1ea133",
    fontSize: "10px",
    fontWeight: 800,
    borderRadius: "999px",
    padding: "4px 8px",
    whiteSpace: "nowrap",
  },

  infoMeta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 8px",
  },

  infoBadge: {
    color: "#334155",
    fontSize: "11px",
    fontWeight: 700,
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.08fr 0.92fr",
    gap: "8px",
    marginTop: "8px",
  },

  detailsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 10px",
    padding: "7px 9px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  detailText: {
    margin: 0,
    color: "#334155",
    fontSize: "11px",
    lineHeight: 1.3,
  },

  descriptionBox: {
    padding: "7px 9px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  descriptionLabel: {
    display: "block",
    marginBottom: "3px",
    color: "#0f172a",
    fontSize: "11px",
    fontWeight: 800,
  },

  descriptionText: {
    margin: 0,
    color: "#475569",
    fontSize: "11px",
    lineHeight: 1.3,
  },

  positionsBox: {
    padding: "7px 9px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  positionsTitle: {
    margin: "0 0 5px",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: 900,
  },

  positionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },

  positionChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#e8f5e9",
    border: "1px solid #b7dfbf",
  },

  positionChipText: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#166534",
  },

  formCard: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: "12px",
    padding: "8px",
    border: "1px solid rgba(255,255,255,0.40)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  formTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 900,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#334155",
  },

  input: {
    width: "100%",
    height: "32px",
    padding: "0 9px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "11px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
  },

  textarea: {
    minHeight: "66px",
    padding: "8px 9px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    resize: "none",
    fontSize: "11px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
    lineHeight: 1.25,
  },

  counterText: {
    alignSelf: "flex-end",
    fontSize: "9px",
    color: "#64748b",
    marginTop: "-1px",
  },

  button: {
    marginTop: "1px",
    border: "none",
    borderRadius: "9px",
    padding: "8px 10px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(34,197,94,0.22)",
    transition: "all 0.2s ease",
  },

  error: {
    marginTop: "6px",
    color: "#dc2626",
    fontWeight: 700,
    fontSize: "11px",
    lineHeight: 1.3,
  },

  success: {
    marginTop: "6px",
    color: "#16a34a",
    fontWeight: 700,
    fontSize: "11px",
    lineHeight: 1.3,
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "13px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  featuresRow: {
    marginTop: "6px",
    width: "100%",
    maxWidth: "760px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    alignItems: "start",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "10px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  featureIcon: {
    fontSize: "14px",
    lineHeight: 1,
  },

  featureText: {
    maxWidth: "85px",
  },

  bottomGlow: {
    marginTop: "4px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "150px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};