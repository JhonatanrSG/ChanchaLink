import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `relative text-[14px] font-semibold text-white transition hover:text-slate-200 ${
      isActive
        ? "after:absolute after:left-0 after:-bottom-[8px] after:h-[2px] after:w-full after:rounded-full after:bg-white"
        : ""
    }`;

  return (
    <header className="w-full border-b border-white/10 bg-[#132238]">
      <div className="mx-auto flex h-[40px] w-full max-w-[1400px] items-center justify-between px-8">
        <div className="flex min-w-[180px] items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo-canchalink.png"
              alt="CanchaLink"
              className="h-[100px] w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="flex items-center gap-10">
          <NavLink to="/" className={navLinkClass}>
            Inicio
          </NavLink>

          <NavLink to="/canchas" className={navLinkClass}>
            Canchas
          </NavLink>

          <NavLink to="/partidos" className={navLinkClass}>
            Partidos
          </NavLink>

          {isAuthenticated && user?.rol === "jugador" && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Mi panel
            </NavLink>
          )}

          {isAuthenticated && user?.rol === "empresa" && (
            <NavLink to="/empresa/dashboard" className={navLinkClass}>
              Panel empresa
            </NavLink>
          )}
        </nav>

        <div className="flex min-w-[180px] items-center justify-end gap-5">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-[14px] font-semibold text-white transition hover:text-slate-200"
              >
                Login
              </Link>

              <Link
                to="/registro"
                className="inline-flex items-center justify-center rounded-md bg-[#1ea133] px-5 py-2 text-[14px] font-bold text-white transition hover:bg-[#18882a]"
              >
                Registrarse
              </Link>
            </>
          ) : (
            <>
              <Link
                to={user?.rol === "empresa" ? "/empresa/perfil" : "/perfil"}
                className="text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                {user?.nombres}
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}