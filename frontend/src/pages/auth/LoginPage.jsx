import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";

const LOGIN_BG = "/images/bg-login.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(form.email, form.password);

      if (data.user.rol === "empresa") {
        try {
          await api.get("/empresa/profile/");
          navigate("/empresa/dashboard");
        } catch (err) {
          if (err?.response?.status === 404) {
            navigate("/empresa/perfil");
          } else {
            navigate("/empresa/dashboard");
          }
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("ERROR LOGIN:", err);
      console.error("ERROR LOGIN RESPONSE:", err?.response);
      console.error("ERROR LOGIN DATA:", err?.response?.data);

      if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("No fue posible iniciar sesión.");
      }
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
              <h2 style={styles.welcome}>Bienvenido a</h2>

              <h1 style={styles.title}>
                <span style={styles.titleDark}>Cancha</span>
                <span style={styles.titleGreen}>Link</span>
              </h1>

              <p style={styles.subtitle}>Reserva canchas y arma tu partido</p>

              <form onSubmit={handleSubmit} style={styles.form}>
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
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.inputPassword}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </button>
              </form>

              {error && <p style={styles.error}>{error}</p>}

              <p style={styles.footerText}>
                ¿No tienes cuenta?{" "}
                <Link to="/registro" style={styles.link}>
                  Registrarse
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
    height: "calc(100vh - 48px)",
    background: `url('${LOGIN_BG}') center/cover no-repeat`,
    overflow: "hidden",
  },

  overlay: {
  minHeight: "calc(100vh - 78px)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingTop: "120px",
  },

  content: {
    width: "100%",
    maxWidth: "860px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transform: "translateY(-30px)",
  },

  logo: {
    width: "185px",
    objectFit: "contain",
    marginBottom: "-30px",
  },

  card: {
    width: "100%",
    maxWidth: "300px",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    padding: "18px 20px 16px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.30)",
    backdropFilter: "blur(8px)",
  },

  welcome: {
    margin: "0 0 4px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#0f172a",
    textAlign: "center",
  },

  title: {
    margin: "0",
    fontSize: "30px",
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
    margin: "10px 0 18px",
    fontSize: "12px",
    color: "#475569",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    height: "40px",
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

  inputPassword: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: "12px",
    color: "#0f172a",
    background: "transparent",
  },

  eyeButton: {
    width: "44px",
    height: "100%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#64748b",
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

  footerText: {
    marginTop: "14px",
    marginBottom: "12px",
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
  },

  link: {
    color: "#ea580c",
    fontWeight: 800,
    textDecoration: "none",
  },

  separatorRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  separatorLine: {
    flex: 1,
    height: "1px",
    background: "#cbd5e1",
  },

  separatorText: {
    color: "#64748b",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  socialRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "12px",
  },

  socialButton: {
    height: "46px",
    borderRadius: "11px",
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(15,23,42,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },

  socialIconGoogle: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#ea4335",
  },

  socialIconFacebook: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#1877f2",
  },

  forgotPassword: {
    display: "block",
    margin: "0 auto",
    border: "none",
    background: "transparent",
    color: "#15803d",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 500,
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