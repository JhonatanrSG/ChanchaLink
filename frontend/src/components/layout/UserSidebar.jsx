import { Link } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

export default function UserSidebar({ user }) {
  const avatar = buildMediaUrl(user?.foto_perfil);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.profileBox}>
        <div style={styles.avatarWrapper}>
          {avatar ? (
            <img src={avatar} alt="Foto de perfil" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {user?.nombres?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>

        <h3 style={styles.name}>
          {user?.nombres} {user?.apellidos}
        </h3>
        <p style={styles.email}>{user?.email}</p>
        <p style={styles.userId}>ID: {user?.id}</p>
      </div>

      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.link}>Mi panel</Link>
        <Link to="/perfil" style={styles.link}>Mi perfil</Link>
        <Link to="/reservas" style={styles.link}>Mis reservas</Link>
        <Link to="/partidos/mis-partidos" style={styles.link}>Mis partidos</Link>
        <Link to="/equipos" style={styles.link}>Mis equipos</Link>
        <Link to="/equipos/crear" style={styles.link}>Crear equipo</Link>
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    minWidth: "280px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    height: "fit-content",
  },
  profileBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  avatarWrapper: {
    marginBottom: "14px",
  },
  avatar: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #22c55e",
  },
  avatarPlaceholder: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    background: "#0f172a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
    border: "3px solid #22c55e",
  },
  name: {
    margin: "0 0 6px",
    color: "#0f172a",
    textAlign: "center",
  },
  email: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
  },
  userId: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
    fontWeight: "600",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  link: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: "600",
  },
};