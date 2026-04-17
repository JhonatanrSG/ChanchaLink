import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/axios";

const BACKEND_URL = "http://127.0.0.1:8000";
const FALLBACK_IMAGE = "/images/hero-cancha.png";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

function getImageOrFallback(path) {
  return buildMediaUrl(path) || FALLBACK_IMAGE;
}

function formatTipoFutbol(tipo) {
  if (!tipo) return "Jugadores por definir";
  const limpio = tipo.toLowerCase().replace("futbol_", "").replace("fútbol_", "");
  const numero = parseInt(limpio, 10);
  if (!isNaN(numero)) return `${numero} jugadores`;
  return tipo;
}

function formatHora(hora) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

function formatFechaPartido(fecha, horaInicio) {
  if (!fecha) return "";
  const fechaPartido = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  const esMismaFecha = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const hora = formatHora(horaInicio);

  if (esMismaFecha(fechaPartido, hoy)) return `Hoy ${hora}`;
  if (esMismaFecha(fechaPartido, manana)) return `Mañana ${hora}`;

  const fechaTexto = fechaPartido.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });

  return `${fechaTexto} ${hora}`;
}

function PageWrapper({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "40px",
        paddingRight: "40px",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, icon, linkTo, linkText }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <h2
        style={{
          color: "white",
          fontSize: "34px",
          fontWeight: 900,
          margin: 0,
        }}
      >
        {icon} {title}
      </h2>

      <Link
        to={linkTo}
        style={{
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: 700,
          textDecoration: "none",
          borderBottom: "2px solid rgba(255,255,255,0.65)",
          paddingBottom: "2px",
        }}
      >
        {linkText}
      </Link>
    </div>
  );
}

const greenHoverButton = {
  backgroundColor: "#1ea133",
  color: "white",
  transition: "background-color 0.2s ease",
};

const handleMouseEnter = (e) => {
  e.currentTarget.style.backgroundColor = "#f98a1a";
};

const handleMouseLeave = (e) => {
  e.currentTarget.style.backgroundColor = "#1ea133";
};

export default function HomePage() {
  const [canchas, setCanchas] = useState([]);
  const [partidos, setPartidos] = useState([]);

  useEffect(() => {
    fetchCanchas();
    fetchPartidos();
  }, []);

  const fetchCanchas = async () => {
    try {
      const response = await api.get("/canchas/");
      setCanchas(response.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartidos = async () => {
    try {
      const response = await api.get("/partidos/");
      setPartidos(response.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div style={{ width: "100%", backgroundColor: "#13294b" }}>
        {/* HERO */}
        <section
          style={{
            width: "100%",
            backgroundImage:
              "linear-gradient(90deg, rgba(8,18,38,0.92) 0%, rgba(8,18,38,0.42) 60%, rgba(8,18,38,0.10) 100%), url(/images/cancha-default.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <PageWrapper>
            <div style={{ paddingTop: "80px", paddingBottom: "80px", maxWidth: "580px" }}>
              <h1
                style={{
                  color: "white",
                  fontSize: "52px",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Reserva tu cancha
                <br />
                y arma tu partido
              </h1>

              <p
                style={{
                  color: "#e2e8f0",
                  fontSize: "20px",
                  marginTop: "20px",
                  lineHeight: 1.6,
                }}
              >
                Encuentra canchas disponibles y jugadores para completar tu equipo en minutos.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "36px",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/canchas"
                  style={{
                    ...greenHoverButton,
                    padding: "16px 32px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "17px",
                    textDecoration: "none",
                    minWidth: "200px",
                    textAlign: "center",
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  Reservar cancha
                </Link>

                <Link
                  to="/partidos"
                  style={{
                    ...greenHoverButton,
                    padding: "16px 32px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "17px",
                    textDecoration: "none",
                    minWidth: "200px",
                    textAlign: "center",
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  Buscar partidos
                </Link>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* SECCIONES */}
        <section
          style={{
            backgroundColor: "#173055",
            paddingTop: "60px",
            paddingBottom: "60px",
          }}
        >
          <PageWrapper>
            {/* CANCHAS */}
            <div style={{ marginBottom: "60px" }}>
              <SectionHeader
                icon="⚽"
                title="Canchas populares"
                linkTo="/canchas"
                linkText="Ver más"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "20px",
                }}
              >
                {canchas.map((cancha) => (
                  <div
                    key={cancha.id}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "14px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "320px",
                      width: "100%",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      style={{
                        height: "142px",
                        overflow: "hidden",
                        backgroundColor: "#cbd5e1",
                      }}
                    >
                      <img
                        src={getImageOrFallback(cancha.imagen)}
                        alt={cancha.nombre}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 900,
                          margin: "0 0 10px 0",
                          color: "#0f172a",
                          lineHeight: 1.2,
                          minHeight: "42px",
                        }}
                      >
                        {cancha.nombre}
                      </h3>

                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                        📍 {cancha.ubicacion || "Ubicación no disponible"}
                      </p>

                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                        👥 {formatTipoFutbol(cancha.tipo_futbol)}
                      </p>

                      <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                        <Link
                          to={`/canchas/${cancha.id}`}
                          style={{
                            ...greenHoverButton,
                            display: "block",
                            textAlign: "center",
                            padding: "11px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                          }}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          Ver disponibilidad
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PARTIDOS */}
            <div style={{ marginBottom: "60px" }}>
              <SectionHeader
                icon="🔥"
                title="Partidos disponibles"
                linkTo="/partidos"
                linkText="Ver más"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "20px",
                }}
              >
                {partidos.map((partido, index) => (
                  <div
                    key={partido.id}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "14px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "320px",
                      width: "100%",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      style={{
                        height: "142px",
                        overflow: "hidden",
                        backgroundColor: "#cbd5e1",
                      }}
                    >
                      <img
                        src={getImageOrFallback(partido.cancha_imagen)}
                        alt={partido.cancha_nombre || `Partido ${index + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 900,
                          margin: "0 0 10px 0",
                          color: "#0f172a",
                          lineHeight: 1.2,
                          minHeight: "42px",
                        }}
                      >
                        {partido.cancha_nombre
                          ? `Partido ${partido.cancha_nombre}`
                          : `Partido ${index + 1}`}
                      </h3>

                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                        📍 {partido.cancha_nombre || "Cancha por definir"}
                      </p>

                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                        📅 {formatFechaPartido(partido.fecha_reserva, partido.hora_inicio)}
                      </p>

                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
                        👥 Vacantes: {partido.jugadores_faltantes ?? 0}
                      </p>

                      <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                        <Link
                          to={`/partidos/${partido.id}`}
                          style={{
                            ...greenHoverButton,
                            display: "block",
                            textAlign: "center",
                            padding: "11px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                          }}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          Postularme
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COMO FUNCIONA */}
            <div style={{ marginBottom: "60px", textAlign: "center" }}>
              <h2
                style={{
                  color: "white",
                  fontSize: "36px",
                  fontWeight: 900,
                  marginBottom: "48px",
                }}
              >
                ¿Cómo funciona CanchaLink?
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "24px",
                }}
              >
                {[
                  { icon: "⚽", label: "Encuentra una cancha" },
                  { icon: "📅", label: "Reserva tu horario" },
                  { icon: "👥", label: "Publica tu partido" },
                  { icon: "🔥", label: "Completa jugadores" },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <span style={{ fontSize: "64px", lineHeight: 1 }}>{icon}</span>
                    <h3
                      style={{
                        color: "white",
                        fontSize: "20px",
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {label}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <footer
              style={{
                borderTop: "1px solid rgba(255,255,255,0.15)",
                paddingTop: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                  gap: "24px",
                }}
              >
                <img
                  src="/images/logo-canchalink.png"
                  alt="CanchaLink"
                  style={{ height: "100px" }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "24px" }}>
                    {["Contacto", "Soporte", "Términos y Condiciones"].map((item) => (
                      <Link
                        key={item}
                        to="#"
                        style={{
                          color: "#cbd5e1",
                          fontSize: "16px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    {[
                      ["#1877F2", "f"],
                      ["#1DA1F2", "t"],
                      ["#E4405F", "i"],
                    ].map(([color, letra]) => (
                      <span
                        key={letra}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "16px",
                        }}
                      >
                        {letra}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </footer>
          </PageWrapper>
        </section>
      </div>
    </MainLayout>
  );
}