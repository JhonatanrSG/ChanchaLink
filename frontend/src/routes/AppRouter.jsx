import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import CanchasPage from "../pages/public/CanchasPage";
import CanchaDetailPage from "../pages/public/CanchaDetailPage";
import PartidosPage from "../pages/public/PartidosPage";
import UserDashboardPage from "../pages/user/UserDashboardPage";
import CompanyDashboardPage from "../pages/company/CompanyDashboardPage";
import PartidoDetailPage from "../pages/public/PartidoDetailPage";
import CompanyCanchasPage from "../pages/company/CompanyCanchasPage";
import CreateEquipoPage from "../pages/private/CreateEquipoPage";
import CreatePartidoPage from "../pages/private/CreatePartidoPage";
import ReservasPage from "../pages/private/ReservasPage";
import CompanyProfilePage from "../pages/company/CompanyProfilePage";
import CompanyPreciosPage from "../pages/company/CompanyPreciosPage";
import MyPartidosPage from "../pages/private/MyPartidosPage";
import ManagePartidoPage from "../pages/private/ManagePartidoPage";
import MyEquiposPage from "../pages/private/MyEquiposPage";
import EquipoDetailPage from "../pages/private/EquipoDetailPage";
import UserProfilePage from "../pages/private/UserProfilePage";
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/canchas" element={<CanchasPage />} />
        <Route path="/canchas/:id" element={<CanchaDetailPage />} />
        <Route path="/partidos" element={<PartidosPage />} />
        <Route path="/partidos/:id" element={<PartidoDetailPage />} />
        <Route path="/dashboard" element={ <PrivateRoute><UserDashboardPage /> </PrivateRoute> } />
        <Route path="/empresa/dashboard" element={ <PrivateRoute> <CompanyDashboardPage /> </PrivateRoute> } />
        <Route path="/empresa/canchas" element={ <PrivateRoute> <CompanyCanchasPage /> </PrivateRoute> } />
        <Route path="/equipos/crear" element={ <PrivateRoute> <CreateEquipoPage /> </PrivateRoute> } />
        <Route path="/partidos/crear/:reservaId" element={ <PrivateRoute> <CreatePartidoPage /> </PrivateRoute> } />
        <Route path="/reservas" element={ <PrivateRoute> <ReservasPage /> </PrivateRoute> } />
        <Route path="/empresa/perfil" element={ <PrivateRoute> <CompanyProfilePage /> </PrivateRoute> } />
        <Route path="/empresa/precios" element={ <PrivateRoute> <CompanyPreciosPage /> </PrivateRoute> } />
        <Route path="/partidos/mis-partidos" element={ <PrivateRoute> <MyPartidosPage /> </PrivateRoute> } />
        <Route path="/partidos/gestionar/:id" element={ <PrivateRoute> <ManagePartidoPage /> </PrivateRoute> } />
        <Route path="/equipos" element={ <PrivateRoute> <MyEquiposPage /> </PrivateRoute> } />
        <Route path="/equipos/:id" element={ <PrivateRoute> <EquipoDetailPage /> </PrivateRoute> } />
        <Route path="/perfil" element={ <PrivateRoute> <UserProfilePage /> </PrivateRoute> } />
      </Routes>
    </BrowserRouter>
  );
}