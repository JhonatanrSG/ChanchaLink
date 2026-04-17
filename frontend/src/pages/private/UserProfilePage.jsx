import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  nombres: "",
  apellidos: "",
  email: "",
  numero_celular: "",
  fecha_nacimiento: "",
  sexo: "",
  foto_perfil: null,
};

const PAGE_BG = "/images/bg-canchas.png";
const BACKEND_URL = "http://127.0.0.1:8000";
const GREEN = "linear-gradient(180deg, #1ea133 0%, #168a2c 100%)";
const ORANGE = "linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function formatSexo(sexo) {
  if (sexo === "masculino") return "Masculino";
  if (sexo === "femenino") return "Femenino";
  if (sexo === "otro") return "Otro";
  return "No definido";
}

export default function UserProfilePage() {
  const { user, loading, refreshMe } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        nombres: user.nombres || "",
        apellidos: user.apellidos || "",
        email: user.email || "",
        numero_celular: user.numero_celular || "",
        fecha_nacimiento: user.fecha_nacimiento || "",
        sexo: user.sexo || "",
        foto_perfil: user.foto_perfil || null,
      });
      setIsEditing(false);
    }
  }, [user]);

  const previewImage = useMemo(() => {
    if (!form.foto_perfil) return null;

    if (typeof form.foto_perfil === "string") {
      return buildMediaUrl(form.foto_perfil);
    }

    return URL.createObjectURL(form.foto_perfil);
  }, [form.foto_perfil]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    let sanitizedValue = value;

    if (type === "file") {
      sanitizedValue = files[0] || null;
    } else {
      if (name === "numero_celular") {
        sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
      }

      if (name === "nombres" || name === "apellidos") {
        sanitizedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const isAdult = (birthDate) => {
    if (!birthDate) return false;

    const today = new Date();
    const birth = new Date(`${birthDate}T00:00:00`);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 18;
  };

  const handleEnableEdit = () => {
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setForm({
        nombres: user.nombres || "",
        apellidos: user.apellidos || "",
        email: user.email || "",
        numero_celular: user.numero_celular || "",
        fecha_nacimiento: user.fecha_nacimiento || "",
        sexo: user.sexo || "",
        foto_perfil: user.foto_perfil || null,
      });
    }

    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("nombres", form.nombres);
      payload.append("apellidos", form.apellidos);
      payload.append("email", form.email);
      payload.append("numero_celular", form.numero_celular);
      payload.append("fecha_nacimiento", form.fecha_nacimiento || "");
      payload.append("sexo", form.sexo || "");

      if (form.numero_celular && form.numero_celular.length !== 10) {
        setError("El número de celular debe tener exactamente 10 dígitos.");
        setSaving(false);
        return;
      }

      if (!isAdult(form.fecha_nacimiento)) {
        setError("Debes ser mayor de edad.");
        setSaving(false);
        return;
      }

      if (form.foto_perfil instanceof File) {
        payload.append("foto_perfil", form.foto_perfil);
      }

      await api.patch("/auth/me/", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Perfil actualizado correctamente.");
      setIsEditing(false);

      if (refreshMe) {
        await refreshMe();
      }
    } catch (err) {
      console.error("ERROR ACTUALIZANDO PERFIL:", err?.response?.data || err);

      if (err?.response?.data) {
        const data = err.response.data;
        const firstKey = Object.keys(data)[0];
        const firstValue = data[firstKey];
        setError(Array.isArray(firstValue) ? firstValue[0] : firstValue);
      } else {
        setError("No fue posible actualizar el perfil.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldsDisabled = !isEditing;

  const handleButtonMouseEnter = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = ORANGE;
  };

  const handleButtonMouseLeave = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = GREEN;
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.wrapper}>
            {loading ? (
              <p style={styles.statusText}>Cargando perfil...</p>
            ) : (
              <>
                <aside style={styles.sidebar}>
                  <div style={styles.sidebarProfile}>
                    <div style={styles.avatarWrap}>
                      <img
                        src={previewImage || user?.foto_perfil || "/images/logo-balon.png"}
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
                      <p style={styles.profileSub}>
                        ID: {user?.id || "--"}
                      </p>
                      <p style={styles.profileSub}>
                        {user?.email || "Jugador"}
                      </p>
                    </div>
                  </div>

                  <nav style={styles.sidebarNav}>
                    <Link to="/dashboard" style={styles.navItem}>
                      <span style={styles.navIcon}>👤</span>
                      <span>Mi panel</span>
                    </Link>

                    <div style={{ ...styles.navItem, ...styles.navItemActive }}>
                      <span style={styles.navIcon}>🪪</span>
                      <span>Mi perfil</span>
                    </div>

                    <Link to="/reservas" style={styles.navItem}>
                      <span style={styles.navIcon}>📅</span>
                      <span>Mis reservas</span>
                    </Link>

                    <Link to="/partidos/mis-partidos" style={styles.navItem}>
                      <span style={styles.navIcon}>⚽</span>
                      <span>Mis partidos</span>
                    </Link>

                    <Link to="/equipos" style={styles.navItem}>
                      <span style={styles.navIcon}>👥</span>
                      <span>Mis equipos</span>
                    </Link>
                  </nav>
                </aside>

                <section style={styles.content}>
                  <div style={styles.header}>
                    <h1 style={styles.title}>Mi perfil</h1>
                    <p style={styles.subtitle}>
                      Consulta y actualiza tu información personal.
                    </p>
                  </div>

                  {error && <p style={styles.error}>{error}</p>}
                  {success && <p style={styles.success}>{success}</p>}

                  <div style={styles.mainGrid}>
                    <div style={styles.leftColumn}>
                      <section style={styles.heroCard}>
                        <div style={styles.heroTop}>
                          <div style={styles.previewBox}>
                            {previewImage ? (
                              <img
                                src={previewImage}
                                alt="Vista previa"
                                style={styles.previewImage}
                              />
                            ) : (
                              <div style={styles.previewPlaceholder}>Sin foto</div>
                            )}
                          </div>

                          <div style={styles.heroInfo}>
                            <span style={styles.profileBadge}>Jugador</span>
                            <h2 style={styles.heroGreeting}>
                              {form.nombres || "Usuario"} {form.apellidos || ""}
                            </h2>
                            <p style={styles.heroText}>
                              Administra tu información personal y mantén tu perfil
                              actualizado dentro de CanchaLink.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section style={styles.sectionCard}>
                        <div style={styles.sectionHeader}>
                          <h2 style={styles.sectionTitle}>Información personal</h2>
                          <span style={styles.stateBadgeSoft}>
                            {isEditing ? "Modo edición" : "Solo lectura"}
                          </span>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.form}>
                          <div style={styles.formGrid}>
                            <div style={styles.fieldFull}>
                              <label style={styles.label}>Foto de perfil</label>
                              <input
                                type="file"
                                name="foto_perfil"
                                accept="image/*"
                                onChange={handleChange}
                                style={styles.input}
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Nombres</label>
                              <input
                                type="text"
                                name="nombres"
                                value={form.nombres}
                                onChange={handleChange}
                                style={styles.input}
                                required
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Apellidos</label>
                              <input
                                type="text"
                                name="apellidos"
                                value={form.apellidos}
                                onChange={handleChange}
                                style={styles.input}
                                required
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Correo electrónico</label>
                              <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                style={styles.input}
                                required
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Número de celular</label>
                              <input
                                type="text"
                                name="numero_celular"
                                value={form.numero_celular}
                                onChange={handleChange}
                                style={styles.input}
                                maxLength={10}
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Fecha de nacimiento</label>
                              <input
                                type="date"
                                name="fecha_nacimiento"
                                value={form.fecha_nacimiento}
                                onChange={handleChange}
                                style={styles.input}
                                disabled={fieldsDisabled}
                              />
                            </div>

                            <div>
                              <label style={styles.label}>Sexo</label>
                              <select
                                name="sexo"
                                value={form.sexo}
                                onChange={handleChange}
                                style={styles.input}
                                disabled={fieldsDisabled}
                              >
                                <option value="">Selecciona una opción</option>
                                <option value="masculino">Masculino</option>
                                <option value="femenino">Femenino</option>
                                <option value="otro">Otro</option>
                              </select>
                            </div>
                          </div>

                          <div style={styles.actions}>
                            {!isEditing && (
                              <button
                                type="button"
                                style={styles.actionButton}
                                onClick={handleEnableEdit}
                                onMouseEnter={handleButtonMouseEnter}
                                onMouseLeave={handleButtonMouseLeave}
                              >
                                Editar perfil
                              </button>
                            )}

                            {isEditing && (
                              <>
                                <button
                                  type="submit"
                                  style={styles.actionButton}
                                  disabled={saving}
                                  onMouseEnter={handleButtonMouseEnter}
                                  onMouseLeave={handleButtonMouseLeave}
                                >
                                  {saving ? "Guardando..." : "Guardar cambios"}
                                </button>

                                <button
                                  type="button"
                                  style={styles.secondaryButton}
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </form>
                      </section>
                    </div>

                    <aside style={styles.rightColumn}>
                      <section style={styles.sideCard}>
                        <h2 style={styles.sideTitle}>Resumen del perfil</h2>

                        <div style={styles.sideInfoList}>
                          <div style={styles.sideInfoItem}>
                            <span style={styles.sideInfoLabel}>Correo</span>
                            <span style={styles.sideInfoValue}>
                              {form.email || "--"}
                            </span>
                          </div>

                          <div style={styles.sideInfoItem}>
                            <span style={styles.sideInfoLabel}>Celular</span>
                            <span style={styles.sideInfoValue}>
                              {form.numero_celular || "--"}
                            </span>
                          </div>

                          <div style={styles.sideInfoItem}>
                            <span style={styles.sideInfoLabel}>Sexo</span>
                            <span style={styles.sideInfoValue}>
                              {formatSexo(form.sexo)}
                            </span>
                          </div>

                          <div style={styles.sideInfoItem}>
                            <span style={styles.sideInfoLabel}>Nacimiento</span>
                            <span style={styles.sideInfoValue}>
                              {form.fecha_nacimiento || "--"}
                            </span>
                          </div>
                        </div>
                      </section>

                      <section style={styles.sideCard}>
                        <h2 style={styles.sideTitle}>Estado</h2>
                        <p style={styles.sideLine}>
                          {isEditing
                            ? "Estás editando tu información personal."
                            : "Tu perfil está en modo consulta."}
                        </p>

                        <div style={styles.sideButtons}>
                          <span style={styles.sideStatus}>
                            {isEditing ? "Editando" : "Protegido"}
                          </span>
                        </div>
                      </section>
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
    margin: 0,
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: 600,
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

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.7fr 0.8fr",
    gap: "16px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  heroCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  heroTop: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  previewBox: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #dbe7f3",
    background: "#f8fafc",
    flexShrink: 0,
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  previewPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: 700,
    fontSize: "14px",
  },

  heroInfo: {
    minWidth: 0,
    flex: 1,
  },

  profileBadge: {
    display: "inline-block",
    marginBottom: "10px",
    background: "#eef6ef",
    color: "#166534",
    border: "1px solid #cde7d2",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
  },

  heroGreeting: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 900,
  },

  heroText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.5,
    maxWidth: "620px",
  },

  sectionCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  stateBadgeSoft: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: 800,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  fieldFull: {
    gridColumn: "1 / -1",
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
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "4px",
  },

  actionButton: {
    background: GREEN,
    color: "#ffffff",
    border: "none",
    textDecoration: "none",
    textAlign: "center",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 800,
    transition: "all 0.2s ease",
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  sideCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.40)",
  },

  sideTitle: {
    margin: "0 0 14px",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: 900,
  },

  sideInfoList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  sideInfoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBottom: "10px",
    borderBottom: "1px solid #e2e8f0",
  },

  sideInfoLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  sideInfoValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 700,
    wordBreak: "break-word",
  },

  sideLine: {
    margin: "0 0 8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  },

  sideButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  sideStatus: {
    background: GREEN,
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
    width: "210px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};