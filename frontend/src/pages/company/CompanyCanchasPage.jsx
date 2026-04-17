import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const RED = "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)";

const MAX_NOMBRE = 40;
const MAX_UBICACION = 40;
const MAX_DESCRIPCION = 90;

const initialForm = {
  nombre: "",
  tipo_futbol: "futbol_5",
  capacidad_jugadores: "",
  ubicacion: "",
  descripcion: "",
  activa: true,
  estado_operativo: "activa",
  imagen: null,
};

function buildMediaUrl(path) {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${BACKEND_URL}${path}`;
  return `${BACKEND_URL}/${path}`;
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Fútbol";
  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);
  if (!isNaN(numero)) return `Fútbol ${numero}`;
  return tipo;
}

function formatEstado(estado) {
  if (!estado) return "No definido";
  if (estado === "activa") return "Activa";
  if (estado === "mantenimiento") return "Mantenimiento";
  if (estado === "inactiva") return "Inactiva";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function sanitizeSingleLineText(value, maxLength) {
  return value.replace(/\s+/g, " ").trimStart().slice(0, maxLength);
}

export default function CompanyCanchasPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [canchas, setCanchas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formTitle = useMemo(() => {
    return editingId ? "Editar cancha" : "Registrar nueva cancha";
  }, [editingId]);

  const previewImage = useMemo(() => {
    if (!form.imagen) return null;

    if (typeof form.imagen === "string") {
      return buildMediaUrl(form.imagen);
    }

    return URL.createObjectURL(form.imagen);
  }, [form.imagen]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  };

  const fetchCanchas = async () => {
    try {
      const response = await api.get("/empresa/canchas/");
      setCanchas(response.data);
    } catch (err) {
      console.error("ERROR CARGANDO CANCHAS EMPRESA:", err);
      setError("No fue posible cargar las canchas de la empresa.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchCanchas();
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setForm((prev) => ({
        ...prev,
        [name]: files[0] || null,
      }));
      return;
    }

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    let sanitizedValue = value;

    if (name === "nombre") {
      sanitizedValue = sanitizeSingleLineText(value, MAX_NOMBRE);
    }

    if (name === "ubicacion") {
      sanitizedValue = sanitizeSingleLineText(value, MAX_UBICACION);
    }

    if (name === "descripcion") {
      sanitizedValue = value.replace(/\n{3,}/g, "\n\n").slice(0, MAX_DESCRIPCION);
    }

    if (name === "capacidad_jugadores") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 2);
    }

    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("nombre", form.nombre.trim());
      payload.append("tipo_futbol", form.tipo_futbol);
      payload.append("capacidad_jugadores", Number(form.capacidad_jugadores));
      payload.append("ubicacion", form.ubicacion.trim());
      payload.append("descripcion", form.descripcion.trim() || "");
      payload.append("activa", form.activa);
      payload.append("estado_operativo", form.estado_operativo);

      if (form.imagen instanceof File) {
        payload.append("imagen", form.imagen);
      }

      if (editingId) {
        await api.put(`/empresa/canchas/${editingId}/`, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Cancha actualizada correctamente.");
      } else {
        await api.post("/empresa/canchas/", payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Cancha creada correctamente.");
      }

      resetForm();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchCanchas();
    } catch (err) {
      console.error("ERROR GUARDANDO CANCHA:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible guardar la cancha.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cancha) => {
    setError("");
    setSuccess("");
    setEditingId(cancha.id);
    setForm({
      nombre: cancha.nombre || "",
      tipo_futbol: cancha.tipo_futbol || "futbol_5",
      capacidad_jugadores: cancha.capacidad_jugadores || "",
      ubicacion: cancha.ubicacion || "",
      descripcion: cancha.descripcion || "",
      activa: cancha.activa,
      estado_operativo: cancha.estado_operativo || "activa",
      imagen: cancha.imagen || null,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const companyAvatar = buildMediaUrl(user?.foto_perfil);

  const resumen = useMemo(() => {
    return {
      total: canchas.length,
      activas: canchas.filter((c) => c.activa).length,
      mantenimiento: canchas.filter((c) => c.estado_operativo === "mantenimiento").length,
      inactivas: canchas.filter((c) => c.estado_operativo === "inactiva").length,
    };
  }, [canchas]);

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
                  <p style={styles.profileSubCentered}>ID: {companyProfile?.id || "--"}</p>
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

                <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                  <span style={styles.navIcon}>⚽</span>
                  <span>Gestión canchas</span>
                </div>

                <Link to="/empresa/precios" style={styles.navItem}>
                  <span style={styles.navIcon}>💲</span>
                  <span>Horarios y precios</span>
                </Link>
              </nav>
            </aside>

            <section style={styles.content}>
              <div style={styles.header}>
                <h1 style={styles.title}>Gestión de canchas</h1>
                <p style={styles.subtitle}>
                  Administra las canchas registradas por tu empresa y controla su estado operativo.
                </p>
              </div>

              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              <section style={styles.summaryCard}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>Resumen de canchas</h2>
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
                    <p style={styles.kpiLabel}>Mantenimiento</p>
                    <h3 style={styles.kpiValue}>{resumen.mantenimiento}</h3>
                  </div>

                  <div style={styles.kpiCard}>
                    <p style={styles.kpiLabel}>Inactivas</p>
                    <h3 style={styles.kpiValue}>{resumen.inactivas}</h3>
                  </div>
                </div>
              </section>

              <div style={styles.pageGrid}>
                <section style={styles.formSection}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>{formTitle}</h2>
                  </div>

                  <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.imageUploadBox}>
                      <div style={styles.previewThumbWrap}>
                        {previewImage ? (
                          <img src={previewImage} alt="Vista previa" style={styles.previewThumb} />
                        ) : (
                          <div style={styles.previewThumbPlaceholder}>Sin imagen</div>
                        )}
                      </div>

                      <div style={styles.imageUploadInfo}>
                        <label style={styles.label}>Imagen de la cancha</label>

                        <input
                          ref={fileInputRef}
                          type="file"
                          name="imagen"
                          accept="image/*"
                          onChange={handleChange}
                          style={styles.hiddenFileInput}
                        />

                        <button
                          type="button"
                          style={styles.fileButton}
                          onClick={handleOpenFilePicker}
                        >
                          Seleccionar imagen
                        </button>
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Nombre</label>
                        <input
                          name="nombre"
                          value={form.nombre}
                          onChange={handleChange}
                          placeholder="Nombre de la cancha"
                          style={styles.input}
                          maxLength={MAX_NOMBRE}
                          required
                        />
                        <span style={styles.counterText}>
                          {form.nombre.length}/{MAX_NOMBRE}
                        </span>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Tipo de fútbol</label>
                        <select
                          name="tipo_futbol"
                          value={form.tipo_futbol}
                          onChange={handleChange}
                          style={styles.input}
                        >
                          <option value="futbol_5">Fútbol 5</option>
                          <option value="futbol_6">Fútbol 6</option>
                          <option value="futbol_7">Fútbol 7</option>
                          <option value="futbol_11">Fútbol 11</option>
                        </select>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Capacidad</label>
                        <input
                          type="number"
                          name="capacidad_jugadores"
                          value={form.capacidad_jugadores}
                          onChange={handleChange}
                          placeholder="Ej: 10"
                          style={styles.input}
                          required
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Ubicación</label>
                        <input
                          name="ubicacion"
                          value={form.ubicacion}
                          onChange={handleChange}
                          placeholder="Ubicación"
                          style={styles.input}
                          maxLength={MAX_UBICACION}
                          required
                        />
                        <span style={styles.counterText}>
                          {form.ubicacion.length}/{MAX_UBICACION}
                        </span>
                      </div>

                      <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                        <label style={styles.label}>Descripción</label>
                        <textarea
                          name="descripcion"
                          value={form.descripcion}
                          onChange={handleChange}
                          placeholder="Describe la cancha"
                          style={styles.textarea}
                          maxLength={MAX_DESCRIPCION}
                        />
                        <span style={styles.counterText}>
                          {form.descripcion.length}/{MAX_DESCRIPCION}
                        </span>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Estado operativo</label>
                        <select
                          name="estado_operativo"
                          value={form.estado_operativo}
                          onChange={handleChange}
                          style={styles.input}
                        >
                          <option value="activa">Activa</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="inactiva">Inactiva</option>
                        </select>
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>Visible</label>
                        <label style={styles.checkboxRowCard}>
                          <input
                            type="checkbox"
                            name="activa"
                            checked={form.activa}
                            onChange={handleChange}
                          />
                          <span>Mostrar cancha</span>
                        </label>
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <button
                        type="submit"
                        style={styles.primaryButton}
                        disabled={saving}
                        onMouseEnter={handlePrimaryMouseEnter}
                        onMouseLeave={handlePrimaryMouseLeave}
                      >
                        {saving
                          ? "Guardando..."
                          : editingId
                          ? "Actualizar cancha"
                          : "Crear cancha"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={resetForm}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </section>

                <section style={styles.listSection}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Mis canchas</h2>
                  </div>

                  {loading ? (
                    <p style={styles.emptyText}>Cargando canchas...</p>
                  ) : canchas.length === 0 ? (
                    <p style={styles.emptyText}>No tienes canchas registradas.</p>
                  ) : (
                    <div style={styles.grid}>
                      {canchas.map((cancha) => (
                        <div key={cancha.id} style={styles.card}>
                          <div style={styles.cardMedia}>
                            {cancha.imagen ? (
                              <img
                                src={buildMediaUrl(cancha.imagen)}
                                alt={cancha.nombre}
                                style={styles.cardImage}
                              />
                            ) : (
                              <div style={styles.cardImagePlaceholder}>Sin imagen</div>
                            )}
                          </div>

                          <div style={styles.cardContent}>
                            <div style={styles.cardHeaderCompact}>
                              <div style={styles.cardTitleWrap}>
                                <h3 style={styles.cardTitleCompact} title={cancha.nombre}>
                                  {cancha.nombre}
                                </h3>
                                <p style={styles.cardUbicacionCompact} title={cancha.ubicacion}>
                                  {cancha.ubicacion}
                                </p>
                              </div>

                              <span
                                style={{
                                  ...styles.statusBadgeCard,
                                  background:
                                    cancha.estado_operativo === "mantenimiento"
                                      ? ORANGE
                                      : cancha.estado_operativo === "inactiva"
                                      ? RED
                                      : GREEN,
                                }}
                              >
                                {formatEstado(cancha.estado_operativo)}
                              </span>
                            </div>

                            <div style={styles.cardMetaGrid}>
                              <div style={styles.metaBox}>
                                <span style={styles.metaBoxLabel}>Capacidad</span>
                                <span style={styles.metaBoxValue}>
                                  {cancha.capacidad_jugadores}
                                </span>
                              </div>

                              <div style={styles.metaBox}>
                                <span style={styles.metaBoxLabel}>Visible</span>
                                <span style={styles.metaBoxValue}>
                                  {cancha.activa ? "Sí" : "No"}
                                </span>
                              </div>
                            </div>

                            <p style={styles.typeTextRow}>
                              <strong style={styles.typeTextLabel}>Tipo:</strong>{" "}
                              <span style={styles.typeTextValue}>
                                {formatTipoFutbol(cancha.tipo_futbol)}
                              </span>
                            </p>
                            <p
                              style={styles.cardDescriptionCompact}
                              title={cancha.descripcion || "Sin descripción"}
                            >
                              {cancha.descripcion || "Sin descripción"}
                            </p>

                            <div style={styles.cardActionsCompact}>
                              <button
                                type="button"
                                style={styles.editButton}
                                onClick={() => handleEdit(cancha)}
                              >
                                Editar cancha
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div style={styles.bottomGlow} />
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

  pageGrid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
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

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  imageUploadBox: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #dbe3ee",
    background: "#f8fafc",
  },

  previewThumbWrap: {
    width: "92px",
    height: "92px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    flexShrink: 0,
  },

  previewThumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  previewThumbPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
  },

  imageUploadInfo: {
    flex: 1,
    minWidth: 0,
  },

  hiddenFileInput: {
    display: "none",
  },

  fileButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    marginTop: "4px",
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

  textarea: {
    width: "100%",
    minHeight: "92px",
    maxHeight: "92px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: 500,
    outline: "none",
    resize: "none",
    boxSizing: "border-box",
    lineHeight: 1.4,
  },

  counterText: {
    display: "block",
    marginTop: "6px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
    textAlign: "right",
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
    minHeight: "340px",
    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  },

  cardMedia: {
    width: "100%",
    height: "170px",
    background: "#e2e8f0",
    flexShrink: 0,
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 700,
    fontSize: "13px",
  },

  cardContent: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: 0,
    flex: 1,
  },

  cardHeaderCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  cardTitleWrap: {
    minWidth: 0,
    flex: 1,
  },

  cardTitleCompact: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1.2,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
    minHeight: "43px",
  },

  cardUbicacionCompact: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
    minHeight: "34px",
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

  cardDescriptionCompact: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "36px",
    wordBreak: "break-word",
  },

  cardActionsCompact: {
    marginTop: "auto",
    display: "flex",
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
    width: "100%",
    boxShadow: "0 8px 18px rgba(234,88,12,0.18)",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
  },

  bottomGlow: {
    marginTop: "14px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "220px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },

  typeTextRow: {
  margin: "2px 0 10px",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.35,
  },

  typeTextLabel: {
    color: "#64748b",
    fontWeight: 800,
  },

  typeTextValue: {
    color: "#0f172a",
    fontWeight: 900,
    fontSize: "15px",
  },
};