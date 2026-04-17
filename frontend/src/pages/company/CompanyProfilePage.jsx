import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "/images/bg-canchas.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";
const SLATE = "linear-gradient(180deg, #334155 0%, #1e293b 100%)";
const USER_PHOTO_ENDPOINT = "/users/profile/";

const initialForm = {
  nombre_empresa: "",
  nit: "",
  direccion: "",
  telefono: "",
  correo_contacto: "",
  descripcion: "",
  activa: true,
};

function buildMediaUrl(path) {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${BACKEND_URL}${path}`;
  return `${BACKEND_URL}/${path}`;
}

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(buildMediaUrl(user?.foto_perfil) || null);

  const fetchProfile = async () => {
    setError("");
    try {
      const response = await api.get("/empresa/profile/");
      setCompanyProfile(response.data);
      setForm({
        nombre_empresa: response.data.nombre_empresa || "",
        nit: response.data.nit || "",
        direccion: response.data.direccion || "",
        telefono: response.data.telefono || "",
        correo_contacto: response.data.correo_contacto || "",
        descripcion: response.data.descripcion || "",
        activa: response.data.activa ?? true,
      });
      setHasProfile(true);
      setIsEditing(false);
    } catch (err) {
      if (err?.response?.status === 404) {
        setHasProfile(false);
        setIsEditing(true);
        setForm(initialForm);
        setCompanyProfile(null);
      } else {
        console.error("ERROR CARGANDO PERFIL EMPRESA:", err);
        setError("No fue posible cargar el perfil de empresa.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(buildMediaUrl(user?.foto_perfil) || null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage, user?.foto_perfil]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditMode = () => {
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Debes seleccionar un archivo de imagen válido.");
      return;
    }

    setSelectedImage(file);
  };

  const handleOpenFilePicker = () => {
    if (hasProfile && !isEditing) return;
    fileInputRef.current?.click();
  };

  const uploadUserPhoto = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("foto_perfil", selectedImage);

    await api.patch(USER_PHOTO_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (selectedImage) {
        await uploadUserPhoto();
      }

      if (hasProfile) {
        await api.put("/empresa/profile/", form);
        setSuccess("Perfil de empresa actualizado correctamente.");
      } else {
        await api.post("/empresa/profile/", form);
        setHasProfile(true);
        setSuccess("Perfil de empresa creado correctamente.");
      }

      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchProfile();
      window.location.reload();
    } catch (err) {
      console.error("ERROR GUARDANDO PERFIL EMPRESA:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible guardar la información de la empresa.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldsDisabled = hasProfile && !isEditing;

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
            {loading ? (
              <p style={styles.statusText}>Cargando perfil empresarial...</p>
            ) : (
              <>
                <aside style={styles.sidebar}>
                  <div style={styles.sidebarProfile}>
                    <div style={styles.avatarWrapLarge}>
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={companyProfile?.nombre_empresa || user?.username || "Empresa"}
                          style={styles.avatarLarge}
                          onError={(e) => {
                            e.currentTarget.src = "/images/logo-balon.png";
                          }}
                        />
                      ) : (
                        <img
                          src="/images/logo-balon.png"
                          alt="Empresa"
                          style={styles.avatarLarge}
                        />
                      )}
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

                    <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                      <span style={styles.navIcon}>🪪</span>
                      <span>Perfil empresa</span>
                    </div>

                    <Link to="/empresa/canchas" style={styles.navItem}>
                      <span style={styles.navIcon}>⚽</span>
                      <span>Gestión canchas</span>
                    </Link>

                    <Link to="/empresa/precios" style={styles.navItem}>
                      <span style={styles.navIcon}>💲</span>
                      <span>Horarios y precios</span>
                    </Link>
                  </nav>
                </aside>

                <section style={styles.content}>
                  <div style={styles.header}>
                    <h1 style={styles.title}>Perfil de empresa</h1>
                    <p style={styles.subtitle}>
                      {hasProfile
                        ? "Consulta y administra la información de tu empresa."
                        : "Completa la información de tu empresa para continuar."}
                    </p>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}

                  <div style={styles.topGrid}>
                    <section style={styles.formCard}>
                      <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Información general</h2>
                      </div>

                      <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.logoEditorBox}>
                          <div style={styles.logoPreviewWrap}>
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Logo de empresa"
                                style={styles.logoPreview}
                                onError={(e) => {
                                  e.currentTarget.src = "/images/logo-balon.png";
                                }}
                              />
                            ) : (
                              <img
                                src="/images/logo-balon.png"
                                alt="Logo por defecto"
                                style={styles.logoPreview}
                              />
                            )}
                          </div>

                          <div style={styles.logoEditorInfo}>
                            <label style={styles.label}>Imagen de empresa</label>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              style={styles.hiddenFileInput}
                              disabled={fieldsDisabled}
                            />

                            <button
                              type="button"
                              style={{
                                ...styles.fileButton,
                                opacity: fieldsDisabled ? 0.65 : 1,
                                cursor: fieldsDisabled ? "not-allowed" : "pointer",
                              }}
                              onClick={handleOpenFilePicker}
                              disabled={fieldsDisabled}
                            >
                              Seleccionar imagen
                            </button>
                          </div>
                        </div>

                        <div style={styles.formGrid}>
                          <div style={styles.fieldGroup}>
                            <label style={styles.label}>Nombre de la empresa</label>
                            <input
                              type="text"
                              name="nombre_empresa"
                              value={form.nombre_empresa}
                              onChange={handleChange}
                              placeholder="Ej: CanchaLink Sports SAS"
                              style={styles.input}
                              required
                              disabled={fieldsDisabled}
                            />
                          </div>

                          <div style={styles.fieldGroup}>
                            <label style={styles.label}>NIT</label>
                            <input
                              type="text"
                              name="nit"
                              value={form.nit}
                              onChange={handleChange}
                              placeholder="Ej: 900123456-7"
                              style={styles.input}
                              required
                              disabled={fieldsDisabled}
                            />
                          </div>

                          <div style={styles.fieldGroup}>
                            <label style={styles.label}>Dirección</label>
                            <input
                              type="text"
                              name="direccion"
                              value={form.direccion}
                              onChange={handleChange}
                              placeholder="Dirección de la empresa"
                              style={styles.input}
                              required
                              disabled={fieldsDisabled}
                            />
                          </div>

                          <div style={styles.fieldGroup}>
                            <label style={styles.label}>Teléfono</label>
                            <input
                              type="text"
                              name="telefono"
                              value={form.telefono}
                              onChange={handleChange}
                              placeholder="Número de contacto"
                              style={styles.input}
                              required
                              disabled={fieldsDisabled}
                            />
                          </div>

                          <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                            <label style={styles.label}>Correo de contacto</label>
                            <input
                              type="email"
                              name="correo_contacto"
                              value={form.correo_contacto}
                              onChange={handleChange}
                              placeholder="contacto@empresa.com"
                              style={styles.input}
                              required
                              disabled={fieldsDisabled}
                            />
                          </div>

                          <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                            <label style={styles.label}>Descripción</label>
                            <textarea
                              name="descripcion"
                              value={form.descripcion}
                              onChange={handleChange}
                              placeholder="Describe brevemente la empresa"
                              style={styles.textarea}
                              disabled={fieldsDisabled}
                            />
                          </div>
                        </div>

                        <label style={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            name="activa"
                            checked={form.activa}
                            onChange={handleChange}
                            disabled={fieldsDisabled}
                          />
                          <span>Empresa activa</span>
                        </label>

                        <div style={styles.actions}>
                          {!hasProfile && (
                            <button
                              type="submit"
                              style={styles.primaryButton}
                              disabled={saving}
                              onMouseEnter={handlePrimaryMouseEnter}
                              onMouseLeave={handlePrimaryMouseLeave}
                            >
                              {saving ? "Guardando..." : "Crear perfil empresa"}
                            </button>
                          )}

                          {hasProfile && !isEditing && (
                            <button
                              type="button"
                              style={styles.primaryButton}
                              onClick={handleEditMode}
                              onMouseEnter={handlePrimaryMouseEnter}
                              onMouseLeave={handlePrimaryMouseLeave}
                            >
                              Modificar perfil
                            </button>
                          )}

                          {hasProfile && isEditing && (
                            <button
                              type="submit"
                              style={styles.primaryButton}
                              disabled={saving}
                              onMouseEnter={handlePrimaryMouseEnter}
                              onMouseLeave={handlePrimaryMouseLeave}
                            >
                              {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                          )}
                        </div>
                      </form>
                    </section>

                    <aside style={styles.infoCard}>
                      <div style={styles.sectionHeaderSmall}>
                        <h2 style={styles.sectionTitle}>Resumen del perfil</h2>
                      </div>

                      <div style={styles.infoStack}>
                        <div style={styles.infoBox}>
                          <span style={styles.infoLabel}>Empresa</span>
                          <span style={styles.infoValue}>
                            {form.nombre_empresa || "Sin definir"}
                          </span>
                        </div>

                        <div style={styles.infoBox}>
                          <span style={styles.infoLabel}>NIT</span>
                          <span style={styles.infoValue}>
                            {form.nit || "Sin definir"}
                          </span>
                        </div>

                        <div style={styles.infoBox}>
                          <span style={styles.infoLabel}>Correo</span>
                          <span style={styles.infoValue}>
                            {form.correo_contacto || "Sin definir"}
                          </span>
                        </div>

                        <div style={styles.infoBox}>
                          <span style={styles.infoLabel}>Teléfono</span>
                          <span style={styles.infoValue}>
                            {form.telefono || "Sin definir"}
                          </span>
                        </div>

                        <div style={styles.infoBox}>
                          <span style={styles.infoLabel}>Estado</span>
                          <span style={styles.infoValue}>
                            {form.activa ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.badgeWrap}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: form.activa ? GREEN : SLATE,
                          }}
                        >
                          {form.activa ? "Perfil activo" : "Perfil inactivo"}
                        </span>
                      </div>
                    </aside>
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

  statusText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: "16px",
    padding: "40px 0",
    gridColumn: "1 / -1",
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.65fr 0.75fr",
    gap: "16px",
    alignItems: "start",
  },

  formCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  infoCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sectionHeader: {
    marginBottom: "16px",
  },

  sectionHeaderSmall: {
    marginBottom: "16px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  logoEditorBox: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #dbe3ee",
    background: "#f8fafc",
  },

  logoPreviewWrap: {
    width: "96px",
    height: "96px",
    borderRadius: "999px",
    overflow: "hidden",
    border: "2px solid #22c55e",
    background: "#ffffff",
    flexShrink: 0,
  },

  logoPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  logoEditorInfo: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  hiddenFileInput: {
    display: "none",
  },

  fileButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "11px 16px",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "4px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  fieldGroup: {
    minWidth: 0,
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#1e293b",
  },

  input: {
    width: "100%",
    padding: "13px 15px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "130px",
    padding: "13px 15px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 700,
  },

  actions: {
    marginTop: "4px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    background: GREEN,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 20px rgba(22,138,44,0.18)",
  },

  infoStack: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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

  badgeWrap: {
    display: "flex",
    marginTop: "16px",
  },

  statusBadge: {
    color: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 800,
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
};