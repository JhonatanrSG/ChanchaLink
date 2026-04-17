import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";

const LOGIN_BG = "/images/bg-login.png";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombres: "",
    apellidos: "",
    numero_celular: "",
    fecha_nacimiento: "",
    sexo: "",
    rol: "jugador",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmpresa = form.rol === "empresa";

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === "numero_celular") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "nombres" || name === "apellidos") {
      sanitizedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }

    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const getFirstErrorMessage = (data) => {
    if (!data || typeof data !== "object") {
      return "No fue posible registrarte.";
    }

    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey];

    if (Array.isArray(firstValue)) {
      return firstValue[0];
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }

    return "No fue posible registrarte.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (form.numero_celular && form.numero_celular.length !== 10) {
      setError("El número de celular debe tener exactamente 10 dígitos.");
      setLoading(false);
      return;
    }

    if (!isAdult(form.fecha_nacimiento)) {
      setError("Debes ser mayor de edad para registrarte.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register/", form);

      if (isEmpresa) {
        setSuccess(
          "Cuenta empresa creada correctamente. Inicia sesión y completa la información de tu empresa."
        );
      } else {
        setSuccess("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
      }

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("ERROR REGISTER:", err?.response?.data || err);
      setError(getFirstErrorMessage(err?.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={styles.page}>
        <div style={styles.overlay}>
          <div style={styles.content}>
            <div style={styles.card}>
              <h2 style={styles.welcome}>Crea tu cuenta en</h2>

              <h1 style={styles.title}>
                <span style={styles.titleDark}>Cancha</span>
                <span style={styles.titleGreen}>Link</span>
              </h1>

              <p style={styles.subtitle}>Encuentra canchas y arma tu partido</p>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <select
                    name="rol"
                    value={form.rol}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="jugador">Jugador</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

                {isEmpresa && (
                  <div style={styles.infoBox}>
                    Estás creando una cuenta de empresa. Después de iniciar sesión
                    deberás completar la información del negocio desde el módulo
                    empresarial.
                  </div>
                )}

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    name="nombres"
                    placeholder="Nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    name="apellidos"
                    placeholder="Apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>✉</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={form.email}
                    onChange={handleChange}
                    style={styles.input}
                    autoComplete="email"
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📞</span>
                  <input
                    type="text"
                    name="numero_celular"
                    placeholder="Número de celular"
                    value={form.numero_celular}
                    onChange={handleChange}
                    style={styles.input}
                    maxLength={10}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📅</span>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={form.fecha_nacimiento}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>⚧</span>
                  <select
                    name="sexo"
                    value={form.sexo}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="">Selecciona tu sexo</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.input}
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? "Registrando..." : "Crear cuenta"}
                </button>
              </form>

              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              <p style={styles.footerText}>
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" style={styles.link}>
                  Inicia sesión
                </Link>
              </p>
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
    </MainLayout>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 48px)",
    background: `url('${LOGIN_BG}') center/cover no-repeat`,
  },

  
  overlay: {
    minHeight: "calc(100vh - 78px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "40px",
  },

  content: {
    width: "100%",
    maxWidth: "860px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transform: "translateY(0)",
  },

  card: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    padding: "20px 22px 18px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.30)",
    backdropFilter: "blur(8px)",
  },

  welcome: {
    margin: "0 0 4px",
    fontSize: "15px",
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "center",
  },

  title: {
    margin: "0",
    fontSize: "34px",
    fontWeight: 900,
    lineHeight: 1,
    textAlign: "center",
    letterSpacing: "-0.03em",
  },

  titleDark: {
    color: "#0f172a",
  },

  titleGreen: {
    color: "#1ea133",
  },

  subtitle: {
    margin: "8px 0 16px",
    fontSize: "13px",
    color: "#475569",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    height: "42px",
    borderRadius: "11px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    overflow: "hidden",
  },

  inputIcon: {
    width: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: "#1ea133",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: "12px",
    color: "#0f172a",
    background: "transparent",
    paddingRight: "14px",
  },

  select: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: "12px",
    color: "#0f172a",
    background: "transparent",
    paddingRight: "14px",
    cursor: "pointer",
  },

  infoBox: {
    marginTop: "2px",
    marginBottom: "2px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "12px",
    lineHeight: 1.4,
  },

  button: {
    marginTop: "2px",
    height: "44px",
    borderRadius: "11px",
    border: "none",
    background: "linear-gradient(180deg, #22c55e 0%, #16913f 100%)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(34,197,94,0.22)",
    transition: "all 0.2s ease",
  },

  error: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#dc2626",
    fontSize: "13px",
    textAlign: "center",
    fontWeight: 600,
  },

  success: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#16a34a",
    fontSize: "13px",
    textAlign: "center",
    fontWeight: 600,
  },

  footerText: {
    marginTop: "12px",
    marginBottom: "4px",
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
  },

  link: {
    color: "#ea580c",
    fontWeight: 800,
    textDecoration: "none",
  },

  featuresRow: {
    marginTop: "14px",
    width: "100%",
    maxWidth: "760px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    alignItems: "start",
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "13px",
    textShadow: "0 4px 10px rgba(0,0,0,0.35)",
  },

  featureIcon: {
    fontSize: "22px",
    lineHeight: 1,
  },

  featureText: {
    maxWidth: "100px",
  },

  bottomGlow: {
    marginTop: "10px",
    width: "180px",
    height: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(34,197,94,0) 0%, rgba(34,197,94,1) 50%, rgba(34,197,94,0) 100%)",
    boxShadow: "0 0 14px rgba(34,197,94,0.6)",
  },
};