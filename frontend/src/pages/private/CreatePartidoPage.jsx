import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";

const BACKEND_URL = "http://127.0.0.1:8000";
const PAGE_BG = "/images/bg-canchas.png";
const FALLBACK_IMAGE = "/images/hero-cancha.png";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";

const initialPosicion = {
  posicion: "arquero",
  cantidad: 1,
};

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

function formatCapacidad(reserva) {
  if (reserva?.cancha_capacidad_jugadores) {
    return `${reserva.cancha_capacidad_jugadores} jugadores`;
  }

  if (reserva?.cancha_tipo_futbol) {
    const limpio = reserva.cancha_tipo_futbol
      .toLowerCase()
      .replace("futbol_", "")
      .replace("fútbol_", "");
    const numero = parseInt(limpio, 10);
    if (!isNaN(numero)) return `${numero * 2} jugadores`;
  }

  return "10 jugadores";
}

function formatTipoPartido(tipo) {
  if (tipo === "publico") return "Público";
  if (tipo === "privado") return "Privado";
  return tipo || "Público";
}

function formatNivel(nivel) {
  if (nivel === "recreativo") return "Recreativo";
  if (nivel === "intermedio") return "Intermedio";
  if (nivel === "competitivo") return "Competitivo";
  return nivel || "Recreativo";
}

function formatDateLabel(fecha) {
  if (!fecha) return "--";
  const date = new Date(`${fecha}T00:00:00`);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });
}

function formatPrice(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString("es-CO")}`;
}

function normalizeHora(hora) {
  if (!hora) return "--";
  return hora.slice(0, 5);
}

export default function CreatePartidoPage() {
  const navigate = useNavigate();
  const { reservaId } = useParams();

  const [reserva, setReserva] = useState(null);
  const [loadingReserva, setLoadingReserva] = useState(true);

  const [equipos, setEquipos] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);

  const [form, setForm] = useState({
    reserva: reservaId || "",
    equipo: "",
    tipo_partido: "publico",
    nivel_partido: "recreativo",
    descripcion: "",
    jugadores_faltantes: 1,
    jugadores_actuales: 1,
    maximo_jugadores: 10,
    estado_partido: "abierto",
    fecha_vencimiento: "",
  });

  const [posicionForm, setPosicionForm] = useState(initialPosicion);
  const [posiciones, setPosiciones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const response = await api.get(`/reservas/${reservaId}/`);
        setReserva(response.data);

        if (response.data.estado_reserva !== "confirmada") {
          setError("Solo puedes crear partidos desde reservas confirmadas.");
        }
      } catch (err) {
        console.error("ERROR CARGANDO RESERVA:", err?.response?.data || err);
        setError("No fue posible cargar la reserva seleccionada.");
      } finally {
        setLoadingReserva(false);
      }
    };

    if (reservaId) {
      fetchReserva();
    } else {
      setLoadingReserva(false);
      setError("No se recibió una reserva válida.");
    }
  }, [reservaId]);

  useEffect(() => {
    const fetchEquipos = async () => {
      setLoadingEquipos(true);
      try {
        const response = await api.get("/equipos/");
        setEquipos(response.data || []);
      } catch (err) {
        console.error("ERROR CARGANDO EQUIPOS:", err?.response?.data || err);
        setEquipos([]);
      } finally {
        setLoadingEquipos(false);
      }
    };

    fetchEquipos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numericFields = [
      "jugadores_faltantes",
      "jugadores_actuales",
      "maximo_jugadores",
    ];

    const sanitizedValue = numericFields.includes(name)
      ? value.replace(/\D/g, "")
      : value;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: sanitizedValue,
      };

      if (name === "tipo_partido" && sanitizedValue === "publico") {
        updated.equipo = "";
      }

      return updated;
    });
  };

  const handlePosicionChange = (e) => {
    const { name, value } = e.target;

    setPosicionForm((prev) => ({
      ...prev,
      [name]: name === "cantidad" ? value.replace(/\D/g, "") : value,
    }));
  };

  const handleAgregarPosicion = () => {
    setError("");
    setSuccess("");

    const cantidad = Number(posicionForm.cantidad);

    if (!posicionForm.posicion || cantidad < 1) {
      setError("Debes seleccionar una posición válida y una cantidad mayor a 0.");
      return;
    }

    const exists = posiciones.find(
      (item) => item.posicion === posicionForm.posicion
    );

    if (exists) {
      setError("Esa posición ya fue agregada. Puedes quitarla y volverla a crear.");
      return;
    }

    setPosiciones((prev) => [
      ...prev,
      {
        posicion: posicionForm.posicion,
        cantidad,
      },
    ]);

    setPosicionForm(initialPosicion);
  };

  const handleEliminarPosicion = (index) => {
    setPosiciones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!reserva || reserva.estado_reserva !== "confirmada") {
      setError("La reserva debe estar confirmada para publicar un partido.");
      return;
    }

    if (form.tipo_partido === "privado" && !form.equipo) {
      setError("Debes seleccionar un equipo para publicar un partido privado.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        reserva: Number(form.reserva),
        equipo: form.tipo_partido === "privado" && form.equipo ? Number(form.equipo) : null,
        jugadores_faltantes: Number(form.jugadores_faltantes),
        jugadores_actuales: Number(form.jugadores_actuales),
        maximo_jugadores: Number(form.maximo_jugadores),
      };

      const partidoResponse = await api.post("/partidos/", payload);
      const partidoId = partidoResponse.data.id;

      for (const posicion of posiciones) {
        await api.post(`/partidos/${partidoId}/posiciones/`, posicion);
      }

      setSuccess("Partido creado correctamente.");

      setTimeout(() => {
        navigate("/partidos/mis-partidos");
      }, 1200);
    } catch (err) {
      console.error("ERROR CREANDO PARTIDO:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible crear el partido.");
      }
    } finally {
      setLoading(false);
    }
  };

  const precioReserva = useMemo(() => {
    if (!reserva) return 0;
    return (
      reserva.precio_final ||
      reserva.valor_total ||
      reserva.precio ||
      reserva.total ||
      45000
    );
  }, [reserva]);

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
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.container}>
            <h1 style={styles.pageTitle}>⚽ Publicar partido</h1>
            <p style={styles.pageSubtitle}>
              Organiza tu partido y encuentra jugadores
            </p>

            {loadingReserva ? (
              <p style={styles.statusText}>Cargando reserva...</p>
            ) : reserva ? (
              <div style={styles.topLayout}>
                <div style={styles.mainPanel}>
                  <div style={styles.reservaHeader}>
                    <div style={styles.imageBox}>
                      <img
                        src={getImageOrFallback(
                          reserva.cancha_imagen || reserva.imagen || reserva.cancha?.imagen
                        )}
                        alt={reserva.cancha_nombre || "Cancha"}
                        style={styles.image}
                      />
                    </div>

                    <div style={styles.info}>
                      <h2 style={styles.title}>
                        {reserva.cancha_nombre || "Cancha reservada"}
                      </h2>

                      <p style={styles.locationText}>
                        📍{" "}
                        {reserva.cancha_ubicacion ||
                          reserva.ubicacion ||
                          "Ubicación no disponible"}
                      </p>

                      <div style={styles.infoMeta}>
                        <span style={styles.infoBadge}>
                          👥 {formatCapacidad(reserva)}
                        </span>
                        <span style={styles.infoBadge}>
                          ⚽{" "}
                          {formatTipoFutbol(
                            reserva.cancha_tipo_futbol || reserva.tipo_futbol
                          )}
                        </span>
                      </div>

                      <div style={styles.infoMeta}>
                        <span style={styles.ratingBadge}>★ 4.8 (120)</span>
                        <span style={styles.companyBadge}>
                          {reserva.cancha_empresa_nombre ||
                            reserva.empresa_nombre ||
                            "CanchaLink"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.divider} />

                    <div style={styles.doubleRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Jugadores faltantes</label>
                        <div style={styles.inputWithIcon}>
                          <span style={styles.inputIcon}>👤</span>
                          <input
                            type="text"
                            name="jugadores_faltantes"
                            value={form.jugadores_faltantes}
                            onChange={handleChange}
                            style={styles.inputBare}
                          />
                        </div>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Nivel</label>
                        <select
                          name="nivel_partido"
                          value={form.nivel_partido}
                          onChange={handleChange}
                          style={styles.select}
                        >
                          <option value="recreativo">Recreativo</option>
                          <option value="intermedio">Intermedio</option>
                          <option value="competitivo">Competitivo</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.doubleRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Tipo de partido</label>
                        <select
                          name="tipo_partido"
                          value={form.tipo_partido}
                          onChange={handleChange}
                          style={styles.select}
                        >
                          <option value="publico">Público</option>
                          <option value="privado">Privado</option>
                        </select>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Máximo de jugadores</label>
                        <input
                          type="text"
                          name="maximo_jugadores"
                          value={form.maximo_jugadores}
                          onChange={handleChange}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    {form.tipo_partido === "privado" && (
                      <div style={styles.doubleRow}>
                        <div style={styles.fieldGroup}>
                          <label style={styles.label}>Equipo asociado</label>
                          <select
                            name="equipo"
                            value={form.equipo}
                            onChange={handleChange}
                            style={styles.select}
                            disabled={loadingEquipos}
                          >
                            <option value="">
                              {loadingEquipos ? "Cargando equipos..." : "Selecciona un equipo"}
                            </option>
                            {equipos.map((equipo) => (
                              <option key={equipo.id} value={equipo.id}>
                                {equipo.nombre_equipo}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div />
                      </div>
                    )}

                    <div style={styles.doubleRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Jugadores actuales</label>
                        <input
                          type="text"
                          name="jugadores_actuales"
                          value={form.jugadores_actuales}
                          onChange={handleChange}
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Fecha vencimiento</label>
                        <input
                          type="datetime-local"
                          name="fecha_vencimiento"
                          value={form.fecha_vencimiento}
                          onChange={handleChange}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div style={styles.doubleRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Posiciones necesarias</label>

                        <div style={styles.posicionFormRow}>
                          <select
                            name="posicion"
                            value={posicionForm.posicion}
                            onChange={handlePosicionChange}
                            style={styles.select}
                          >
                            <option value="arquero">Arquero</option>
                            <option value="defensa">Defensa</option>
                            <option value="medio">Medio</option>
                            <option value="delantero">Delantero</option>
                          </select>

                          <input
                            type="text"
                            name="cantidad"
                            value={posicionForm.cantidad}
                            onChange={handlePosicionChange}
                            style={styles.input}
                          />

                          <button
                            type="button"
                            style={styles.addButton}
                            onClick={handleAgregarPosicion}
                            onMouseEnter={handleButtonMouseEnter}
                            onMouseLeave={handleButtonMouseLeave}
                          >
                            Agregar
                          </button>
                        </div>

                        {posiciones.length > 0 && (
                          <div style={styles.tagsRow}>
                            {posiciones.map((item, index) => (
                              <div key={`${item.posicion}-${index}`} style={styles.tag}>
                                <span style={styles.tagText}>
                                  {item.posicion} ({item.cantidad})
                                </span>
                                <button
                                  type="button"
                                  style={styles.removeTagButton}
                                  onClick={() => handleEliminarPosicion(index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Descripción</label>
                        <textarea
                          name="descripcion"
                          value={form.descripcion}
                          onChange={handleChange}
                          placeholder="Partido amistoso, buen ambiente..."
                          style={styles.textarea}
                          maxLength={200}
                        />
                        <span style={styles.counterText}>
                          {form.descripcion.length} / 200
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={styles.publishButton}
                      disabled={loading}
                      onMouseEnter={handleButtonMouseEnter}
                      onMouseLeave={handleButtonMouseLeave}
                    >
                      {loading ? "Publicando..." : "Publicar partido"}
                    </button>
                  </form>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}
                </div>

                <aside style={styles.summaryPanel}>
                  <h3 style={styles.summaryTitle}>Resumen de reserva</h3>

                  <div style={styles.summaryGroup}>
                    <p style={styles.summaryText}>
                      <strong>Cancha:</strong> {reserva.cancha_nombre}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Fecha:</strong> {formatDateLabel(reserva.fecha_reserva)}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Hora:</strong>{" "}
                      {`${normalizeHora(reserva.hora_inicio)} - ${normalizeHora(
                        reserva.hora_fin
                      )}`}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Tipo:</strong>{" "}
                      {formatTipoFutbol(
                        reserva.cancha_tipo_futbol || reserva.tipo_futbol
                      )}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Precio reserva:</strong> {formatPrice(precioReserva)}
                    </p>
                    <p style={styles.summaryText}>
                      <strong>Partido:</strong> {formatTipoPartido(form.tipo_partido)}
                    </p>
                    {form.tipo_partido === "privado" && form.equipo && (
                      <p style={styles.summaryText}>
                        <strong>Equipo:</strong>{" "}
                        {equipos.find((eq) => String(eq.id) === String(form.equipo))?.nombre_equipo || "--"}
                      </p>
                    )}
                    <p style={styles.summaryText}>
                      <strong>Nivel:</strong> {formatNivel(form.nivel_partido)}
                    </p>
                  </div>
                </aside>
              </div>
            ) : (
              <p style={styles.statusText}>No se encontró la reserva.</p>
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
    height: "calc(100vh - 48px)",
    background: `url('${PAGE_BG}') center/cover no-repeat`,
    overflow: "hidden",
  },

  overlay: {
    height: "calc(100vh - 48px)",
    padding: "10px 18px 10px",
    background: "linear-gradient(rgba(3,10,24,0.22), rgba(3,10,24,0.30))",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
  },

  pageTitle: {
    margin: "0",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  pageSubtitle: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    textAlign: "center",
    textShadow: "0 4px 16px rgba(0,0,0,0.35)",
  },

  topLayout: {
    display: "grid",
    gridTemplateColumns: "1.55fr 0.72fr",
    gap: "10px",
    alignItems: "start",
  },

  mainPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "14px",
    padding: "8px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.45)",
  },

  summaryPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.45)",
  },

  reservaHeader: {
    display: "grid",
    gridTemplateColumns: "138px 1fr",
    gap: "8px",
    marginBottom: "2px",
  },

  imageBox: {
    width: "100%",
    height: "74px",
    borderRadius: "8px",
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
    gap: "4px",
  },

  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 900,
  },

  locationText: {
    margin: 0,
    fontSize: "11px",
    color: "#475569",
    fontWeight: 600,
  },

  infoMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  infoBadge: {
    fontSize: "11px",
    color: "#334155",
    fontWeight: 700,
  },

  ratingBadge: {
    fontSize: "11px",
    color: "#334155",
    fontWeight: 800,
  },

  companyBadge: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: 700,
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "6px 0 8px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  doubleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    alignItems: "start",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#334155",
  },

  inputWithIcon: {
    display: "flex",
    alignItems: "center",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    overflow: "hidden",
  },

  inputIcon: {
    width: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: "#166534",
    flexShrink: 0,
  },

  inputBare: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: "12px",
    paddingRight: "8px",
  },

  input: {
    width: "100%",
    height: "30px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "12px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    height: "30px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "12px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
    cursor: "pointer",
  },

  textarea: {
    minHeight: "46px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    resize: "none",
    fontSize: "12px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box",
    lineHeight: 1.25,
  },

  counterText: {
    alignSelf: "flex-end",
    fontSize: "10px",
    color: "#64748b",
    marginTop: "-1px",
  },

  posicionFormRow: {
    display: "grid",
    gridTemplateColumns: "1fr 0.45fr auto",
    gap: "6px",
    alignItems: "center",
  },

  addButton: {
    height: "30px",
    border: "none",
    borderRadius: "8px",
    padding: "0 10px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  tagsRow: {
    marginTop: "6px",
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
  },

  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 7px",
    borderRadius: "8px",
    background: "#e8f5e9",
    border: "1px solid #b7dfbf",
  },

  tagText: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#166534",
  },

  removeTagButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },

  publishButton: {
    marginTop: "0",
    width: "100%",
    maxWidth: "200px",
    alignSelf: "center",
    border: "none",
    borderRadius: "9px",
    padding: "8px 10px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(34,197,94,0.20)",
    transition: "all 0.2s ease",
  },

  summaryTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 900,
  },

  summaryGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  summaryText: {
    margin: 0,
    color: "#334155",
    fontSize: "11px",
    lineHeight: 1.3,
  },

  error: {
    marginTop: "8px",
    color: "#dc2626",
    fontWeight: 700,
    textAlign: "center",
    fontSize: "12px",
  },

  success: {
    marginTop: "8px",
    color: "#16a34a",
    fontWeight: 700,
    textAlign: "center",
    fontSize: "12px",
  },

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "14px",
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
    gap: "8px",
    alignItems: "start",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "11px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  featureIcon: {
    fontSize: "16px",
    lineHeight: 1,
  },

  featureText: {
    maxWidth: "95px",
  },

  bottomGlow: {
    marginTop: "5px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "170px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};