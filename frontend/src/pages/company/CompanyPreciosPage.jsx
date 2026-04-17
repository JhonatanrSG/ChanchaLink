import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";
const ITEMS_PER_PAGE = 4;

const initialForm = {
  dia_semana: "lunes",
  hora_inicio: "",
  hora_fin: "",
  valor: "",
  fecha_vigencia_inicio: "",
  fecha_vigencia_fin: "",
  activa: true,
};

const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

function buildMediaUrl(path) {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${BACKEND_URL}${path}`;
  return `${BACKEND_URL}/${path}`;
}

function formatDia(dia) {
  if (!dia) return "";
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "$0";
  const number = Number(value);
  if (Number.isNaN(number)) return `$${value}`;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(number);
}

function getMinutesFromTime(time) {
  if (!time || !time.includes(":")) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isOneHourBlock(horaInicio, horaFin) {
  const start = getMinutesFromTime(horaInicio);
  const end = getMinutesFromTime(horaFin);

  if (start === null || end === null) return false;
  if (end <= start) return false;

  return end - start === 60;
}

export default function CompanyPreciosPage() {
  const { user } = useAuth();

  const [canchas, setCanchas] = useState([]);
  const [selectedCanchaId, setSelectedCanchaId] = useState("");
  const [selectedDia, setSelectedDia] = useState("lunes");
  const [precios, setPrecios] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [loadingPrecios, setLoadingPrecios] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const formTitle = useMemo(() => {
    return editingId ? "Editar configuración de precio" : "Nueva configuración de precio";
  }, [editingId]);

  const preciosFiltrados = useMemo(() => {
    return precios.filter((precio) => precio.dia_semana === selectedDia);
  }, [precios, selectedDia]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(preciosFiltrados.length / ITEMS_PER_PAGE));
  }, [preciosFiltrados]);

  const preciosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return preciosFiltrados.slice(start, end);
  }, [preciosFiltrados, currentPage]);

  const selectedCancha = useMemo(() => {
    return canchas.find((cancha) => String(cancha.id) === String(selectedCanchaId)) || null;
  }, [canchas, selectedCanchaId]);

  const companyAvatar = buildMediaUrl(user?.foto_perfil);

  const resumen = useMemo(() => {
    const total = precios.length;
    const activas = precios.filter((precio) => precio.activa).length;
    const inactivas = precios.filter((precio) => !precio.activa).length;
    const hoy = preciosFiltrados.length;

    return {
      total,
      activas,
      inactivas,
      hoy,
    };
  }, [precios, preciosFiltrados]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDia, selectedCanchaId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const fetchCanchas = async () => {
    try {
      const response = await api.get("/empresa/canchas/");
      setCanchas(response.data);

      if (response.data.length > 0 && !selectedCanchaId) {
        setSelectedCanchaId(String(response.data[0].id));
      }
    } catch (err) {
      console.error("ERROR CARGANDO CANCHAS:", err);
      setError("No fue posible cargar las canchas.");
    } finally {
      setLoadingCanchas(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get("/empresa/profile/");
      setCompanyProfile(response.data);
    } catch (err) {
      console.error("ERROR PERFIL EMPRESA:", err);
    }
  };

  const fetchPrecios = async (canchaId) => {
    if (!canchaId) return;

    setLoadingPrecios(true);
    try {
      const response = await api.get(`/empresa/canchas/${canchaId}/precios/`);
      setPrecios(response.data);
    } catch (err) {
      console.error("ERROR CARGANDO PRECIOS:", err);
      setError("No fue posible cargar las configuraciones de precio.");
    } finally {
      setLoadingPrecios(false);
    }
  };

  useEffect(() => {
    fetchCanchas();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (selectedCanchaId) {
      fetchPrecios(selectedCanchaId);
    }
  }, [selectedCanchaId]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      dia_semana: selectedDia,
    });
    setEditingId(null);
    setError("");
  };

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({
        ...prev,
        dia_semana: selectedDia,
      }));
    }
  }, [selectedDia, editingId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !selectedCanchaId) return;

    setError("");
    setSuccess("");

    if (!isOneHourBlock(form.hora_inicio, form.hora_fin)) {
      setError("Cada configuración debe cubrir exactamente 1 hora. Ejemplo: 08:00 a 09:00.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        valor: String(form.valor),
      };

      if (editingId) {
        await api.put(`/empresa/precios/${editingId}/`, payload);
        setSuccess("Configuración de precio actualizada correctamente.");
      } else {
        await api.post(`/empresa/canchas/${selectedCanchaId}/precios/`, payload);
        setSuccess("Configuración de precio creada correctamente.");
      }

      resetForm();
      await fetchPrecios(selectedCanchaId);
    } catch (err) {
      console.error("ERROR GUARDANDO PRECIO:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible guardar la configuración de precio.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (precio) => {
    setError("");
    setSuccess("");
    setEditingId(precio.id);
    setSelectedDia(precio.dia_semana);

    setForm({
      dia_semana: precio.dia_semana,
      hora_inicio: precio.hora_inicio,
      hora_fin: precio.hora_fin,
      valor: precio.valor,
      fecha_vigencia_inicio: precio.fecha_vigencia_inicio,
      fecha_vigencia_fin: precio.fecha_vigencia_fin || "",
      activa: precio.activa,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleEstado = async (precio) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/empresa/precios/${precio.id}/estado/`, {
        activa: !precio.activa,
      });

      setSuccess("Estado de la configuración actualizado correctamente.");
      await fetchPrecios(selectedCanchaId);
    } catch (err) {
      console.error("ERROR CAMBIANDO ESTADO PRECIO:", err?.response?.data || err);
      setError("No fue posible actualizar el estado de la configuración.");
    }
  };

  const handlePrimaryMouseEnter = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = ORANGE;
  };

  const handlePrimaryMouseLeave = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            <aside style={styles.sidebar}>
              <div style={styles.sidebarProfile}>
                <div style={styles.avatarWrapLarge}>
                  <img
                    src={companyAvatar || "/images/logo-balon.png"}
                    alt={companyProfile?.nombre_empresa || user?.username || "Empresa"}
                    style={styles.avatarLarge}
                    onError={(e) => {
                      e.currentTarget.src = "/images/logo-balon.png";
                    }}
                  />
                </div>

                <div style={styles.profileInfoCentered}>
                  <h3 style={styles.profileNameCentered}>
                    {companyProfile?.nombre_empresa || user?.username || "Empresa"}
                  </h3>
                  <p style={styles.profileSubCentered}>
                    {companyProfile?.correo_contacto || user?.email || "--"}
                  </p>
                  <p style={styles.profileSubCentered}>
                    ID: {companyProfile?.id || "--"}
                  </p>
                </div>
              </div>

              <nav style={styles.sidebarNav}>
                <Link to="/empresa/dashboard" style={styles.navItem}>
                  <span style={styles.navIcon}>🏢</span>
                  <span>Panel empresa</span>
                </Link>

                <Link to="/empresa/perfil" style={styles.navItem}>
                  <span style={styles.navIcon}>🪪</span>
                  <span>Perfil empresa</span>
                </Link>

                <Link to="/empresa/canchas" style={styles.navItem}>
                  <span style={styles.navIcon}>⚽</span>
                  <span>Gestión canchas</span>
                </Link>

                <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                  <span style={styles.navIcon}>💲</span>
                  <span>Horarios y precios</span>
                </div>
              </nav>
            </aside>

            <section style={styles.content}>
              <div style={styles.header}>
                <h1 style={styles.title}>Gestión de horarios y precios</h1>
                <p style={styles.subtitle}>
                  Configura precios por bloques de 1 hora para cada cancha.
                </p>
              </div>

              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              <section style={styles.summaryCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Resumen de configuraciones</h2>
                </div>

                <div style={styles.kpiGrid}>
                  <div style={styles.kpiCard}>
                    <p style={styles.kpiLabel}>Total</p>
                    <h3 style={styles.kpiValue}>{resumen.total}</h3>
                  </div>

                  <div style={styles.kpiCard}>
                    <p style={styles.kpiLabel}>Activas</p>
                    <h3 style={styles.kpiValue}>{resumen.activas}</h3>
                  </div>

                  <div style={styles.kpiCard}>
                    <p style={styles.kpiLabel}>Inactivas</p>
                    <h3 style={styles.kpiValue}>{resumen.inactivas}</h3>
                  </div>

                  <div style={styles.kpiCard}>
                    <p style={styles.kpiLabel}>{formatDia(selectedDia)}</p>
                    <h3 style={styles.kpiValue}>{resumen.hoy}</h3>
                  </div>
                </div>
              </section>

              <div style={styles.filtersRow}>
                <div style={styles.filterBox}>
                  <label style={styles.label}>Selecciona una cancha</label>
                  <select
                    value={selectedCanchaId}
                    onChange={(e) => {
                      setSelectedCanchaId(e.target.value);
                      resetForm();
                    }}
                    style={styles.select}
                  >
                    <option value="">Selecciona una cancha</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.id} value={cancha.id}>
                        {cancha.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterBox}>
                  <label style={styles.label}>Filtrar por día</label>
                  <select
                    value={selectedDia}
                    onChange={(e) => setSelectedDia(e.target.value)}
                    style={styles.select}
                  >
                    {DIAS.map((dia) => (
                      <option key={dia} value={dia}>
                        {formatDia(dia)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCancha && (
                <section style={styles.selectedCanchaCard}>
                  <div style={styles.selectedCanchaHeader}>
                    <div>
                      <p style={styles.selectedCanchaLabel}>Cancha seleccionada</p>
                      <h3 style={styles.selectedCanchaName}>{selectedCancha.nombre}</h3>
                    </div>

                    <span style={styles.selectedCanchaBadge}>
                      {selectedCancha.tipo_futbol?.replace("_", " ").replace("futbol", "Fútbol")}
                    </span>
                  </div>

                  <p style={styles.selectedCanchaText}>
                    {selectedCancha.ubicacion || "Sin ubicación registrada"}
                  </p>
                </section>
              )}

              <div style={styles.pageGrid}>
                <section style={styles.formSection}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>{formTitle}</h2>
                  </div>

                  <div style={styles.noticeCard}>
                    <p style={styles.noticeTitle}>Regla de negocio</p>
                    <p style={styles.noticeText}>
                      Cada precio debe registrarse por bloques exactos de 1 hora.
                      Ejemplos válidos: 08:00 - 09:00, 18:00 - 19:00.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Día de la semana</label>
                        <select
                          name="dia_semana"
                          value={form.dia_semana}
                          onChange={handleChange}
                          style={styles.input}
                        >
                          <option value="lunes">Lunes</option>
                          <option value="martes">Martes</option>
                          <option value="miercoles">Miércoles</option>
                          <option value="jueves">Jueves</option>
                          <option value="viernes">Viernes</option>
                          <option value="sabado">Sábado</option>
                          <option value="domingo">Domingo</option>
                        </select>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Valor</label>
                        <input
                          type="number"
                          name="valor"
                          value={form.valor}
                          onChange={handleChange}
                          placeholder="Ej: 45000"
                          style={styles.input}
                          required
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Hora inicio</label>
                        <input
                          type="time"
                          name="hora_inicio"
                          value={form.hora_inicio}
                          onChange={handleChange}
                          style={styles.input}
                          required
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Hora fin</label>
                        <input
                          type="time"
                          name="hora_fin"
                          value={form.hora_fin}
                          onChange={handleChange}
                          style={styles.input}
                          required
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Fecha vigencia inicio</label>
                        <input
                          type="date"
                          name="fecha_vigencia_inicio"
                          value={form.fecha_vigencia_inicio}
                          onChange={handleChange}
                          style={styles.input}
                          required
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Fecha vigencia fin</label>
                        <input
                          type="date"
                          name="fecha_vigencia_fin"
                          value={form.fecha_vigencia_fin}
                          onChange={handleChange}
                          style={styles.input}
                        />
                      </div>

                      <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                        <label style={styles.label}>Estado</label>
                        <label style={styles.checkboxRowCard}>
                          <input
                            type="checkbox"
                            name="activa"
                            checked={form.activa}
                            onChange={handleChange}
                          />
                          <span>Configuración activa</span>
                        </label>
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <button
                        type="submit"
                        style={styles.primaryButton}
                        disabled={saving || !selectedCanchaId}
                        onMouseEnter={handlePrimaryMouseEnter}
                        onMouseLeave={handlePrimaryMouseLeave}
                      >
                        {saving
                          ? "Guardando..."
                          : editingId
                          ? "Actualizar precio"
                          : "Crear precio"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={resetForm}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </form>
                </section>

                <section style={styles.listSection}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>
                      Configuraciones registradas para {formatDia(selectedDia)}
                    </h2>
                  </div>

                  {loadingCanchas ? (
                    <p style={styles.emptyText}>Cargando canchas...</p>
                  ) : !selectedCanchaId ? (
                    <p style={styles.emptyText}>Selecciona una cancha.</p>
                  ) : loadingPrecios ? (
                    <p style={styles.emptyText}>Cargando configuraciones...</p>
                  ) : preciosFiltrados.length === 0 ? (
                    <p style={styles.emptyText}>No hay configuraciones para este día.</p>
                  ) : (
                    <>
                      <div style={styles.grid}>
                        {preciosPaginados.map((precio) => (
                          <div key={precio.id} style={styles.card}>
                            <div style={styles.cardHeaderCompact}>
                              <div style={styles.cardTitleWrap}>
                                <h3 style={styles.cardTitleCompact}>
                                  {precio.cancha_nombre || selectedCancha?.nombre || "Cancha"}
                                </h3>
                                <p style={styles.cardSubCompact}>
                                  {formatDia(precio.dia_semana)}
                                </p>
                              </div>

                              <span
                                style={{
                                  ...styles.statusBadgeCard,
                                  background: precio.activa ? GREEN : SLATE,
                                }}
                              >
                                {precio.activa ? "Activa" : "Inactiva"}
                              </span>
                            </div>

                            <div style={styles.cardMetaGrid}>
                              <div style={styles.metaBox}>
                                <span style={styles.metaBoxLabel}>Hora inicio</span>
                                <span style={styles.metaBoxValue}>
                                  {precio.hora_inicio}
                                </span>
                              </div>

                              <div style={styles.metaBox}>
                                <span style={styles.metaBoxLabel}>Hora fin</span>
                                <span style={styles.metaBoxValue}>
                                  {precio.hora_fin}
                                </span>
                              </div>
                            </div>

                            <p style={styles.priceTextRow}>
                              <strong style={styles.priceTextLabel}>Valor:</strong>{" "}
                              <span style={styles.priceTextValue}>
                                {formatMoney(precio.valor)}
                              </span>
                            </p>

                            <p style={styles.cardDescriptionCompact}>
                              <strong>Vigencia:</strong>{" "}
                              {precio.fecha_vigencia_inicio} - {precio.fecha_vigencia_fin || "Sin fin"}
                            </p>

                            <div style={styles.cardActionsCompact}>
                              <button
                                type="button"
                                style={styles.editButton}
                                onClick={() => handleEdit(precio)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                style={styles.stateButton}
                                onClick={() => handleToggleEstado(precio)}
                              >
                                {precio.activa ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div style={styles.pagination}>
                          <button
                            type="button"
                            style={{
                              ...styles.pageButton,
                              opacity: currentPage === 1 ? 0.5 : 1,
                              cursor: currentPage === 1 ? "not-allowed" : "pointer",
                            }}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            {"<"}
                          </button>

                          <span style={styles.pageInfo}>
                            Página {currentPage} de {totalPages}
                          </span>

                          <button
                            type="button"
                            style={{
                              ...styles.pageButton,
                              opacity: currentPage === totalPages ? 0.5 : 1,
                              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                            }}
                            onClick={() =>
                              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                          >
                            {">"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            </section>
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
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "22px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  avatarWrapLarge: {
    width: "128px",
    height: "128px",
    borderRadius: "999px",
    overflow: "hidden",
    border: "3px solid rgba(34,197,94,0.95)",
    background: "#0f172a",
    flexShrink: 0,
  },

  avatarLarge: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  profileInfoCentered: {
    textAlign: "center",
    minWidth: 0,
  },

  profileNameCentered: {
    margin: "0 0 6px",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1.15,
  },

  profileSubCentered: {
    margin: "4px 0 0",
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.4,
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

  success: {
    color: "#bbf7d0",
    marginBottom: "14px",
    fontWeight: 700,
  },

  summaryCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    marginBottom: "16px",
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

  filtersRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },

  filterBox: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  selectedCanchaCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    marginBottom: "16px",
  },

  selectedCanchaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  selectedCanchaLabel: {
    margin: "0 0 6px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },

  selectedCanchaName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 900,
  },

  selectedCanchaBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  selectedCanchaText: {
    margin: "8px 0 0",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.35,
  },

  pageGrid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "18px",
    alignItems: "start",
  },

  formSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
    height: "fit-content",
    position: "sticky",
    top: "16px",
  },

  listSection: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  noticeCard: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "14px",
    border: "1px solid #e2e8f0",
    marginBottom: "14px",
  },

  noticeTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 900,
  },

  noticeText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  fieldGroup: {
    minWidth: 0,
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#1e293b",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  checkboxRowCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minHeight: "46px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "6px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "11px 15px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(22,138,44,0.18)",
  },

  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "11px 15px",
    background: "#64748b",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "start",
  },

  card: {
    background: "#f8fafc",
    borderRadius: "18px",
    border: "1px solid #dbe3ee",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "220px",
    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
    padding: "14px",
  },

  cardHeaderCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
  },

  cardTitleWrap: {
    minWidth: 0,
    flex: 1,
  },

  cardTitleCompact: {
    margin: 0,
    color: "#0f172a",
    fontSize: "17px",
    fontWeight: 900,
    lineHeight: 1.1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  cardSubCompact: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusBadgeCard: {
    color: "#ffffff",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flexShrink: 0,
    boxShadow: "0 6px 14px rgba(0,0,0,0.10)",
  },

  cardMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    marginBottom: "10px",
  },

  metaBox: {
    background: "#ffffff",
    border: "1px solid #dbe3ee",
    borderRadius: "14px",
    padding: "8px 10px",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  metaBoxLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    lineHeight: 1,
  },

  metaBoxValue: {
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: 800,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  priceTextRow: {
    margin: "2px 0 10px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.35,
  },

  priceTextLabel: {
    color: "#64748b",
    fontWeight: 800,
  },

  priceTextValue: {
    color: "#0f172a",
    fontWeight: 900,
    fontSize: "16px",
  },

  cardDescriptionCompact: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.4,
    minHeight: "36px",
  },

  cardActionsCompact: {
    marginTop: "auto",
    display: "flex",
    gap: "10px",
  },

  editButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 12px",
    background: ORANGE,
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "13px",
    flex: 1,
    boxShadow: "0 8px 18px rgba(234,88,12,0.18)",
  },

  stateButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "13px",
    flex: 1,
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
  },

  pagination: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  pageButton: {
    border: "none",
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "16px",
  },

  pageInfo: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: 800,
  },
};