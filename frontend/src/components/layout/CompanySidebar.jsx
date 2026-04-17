import { Link } from "react-router-dom";

const BACKEND_URL = "http://127.0.0.1:8000";

function buildMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

export default function CompanySidebar({ user, companyProfile }) {
  const avatar = buildMediaUrl(user?.foto_perfil);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.profileBox}>
        <div style={styles.avatarWrapper}>
          {avatar ? (
            <img src={avatar} alt="Foto de perfil" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {companyProfile?.nombre_empresa?.[0]?.toUpperCase() ||
                user?.nombres?.[0]?.toUpperCase() ||
                "E"}
            </div>
          )}
        </div>

        <h3 style={styles.name}>
          {companyProfile?.nombre_empresa || `${user?.nombres} ${user?.apellidos}`}
        </h3>
        <p style={styles.email}>{user?.email}</p>
        <p style={styles.userId}>ID: {user?.id}</p>
      </div>

      <nav style={styles.nav}>
        <Link to="/empresa/dashboard" style={styles.link}>Panel empresa</Link>
        <Link to="/empresa/perfil" style={styles.link}>Perfil empresa</Link>
        <Link to="/empresa/canchas" style={styles.link}>Gestión canchas</Link>
        <Link to="/empresa/precios" style={styles.link}>Horarios y precios</Link>
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