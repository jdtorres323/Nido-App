import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Servicios from './pages/Servicios';
import Escaner from './pages/Escaner';
import Analisis from './pages/Analisis';
import Familia from './pages/Familia';
import NuevoGasto from './pages/NuevoGasto';
import NuevoServicio from './pages/NuevoServicio';
import { AuthProvider } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout title="Resumen Mensual"><Dashboard /></Layout>} />
            <Route path="/servicios" element={<Layout title="Gestión de Servicios"><Servicios /></Layout>} />
            <Route path="/escaner" element={<Layout title="Escáner"><Escaner /></Layout>} />
            <Route path="/analisis" element={<Layout title="Análisis"><Analisis /></Layout>} />
            <Route path="/familia" element={<Layout title="Directorio Familiar"><Familia /></Layout>} />
            <Route path="/nuevo-gasto" element={<Layout title="Añadir Gasto"><NuevoGasto /></Layout>} />
            <Route path="/editar-gasto/:id" element={<Layout title="Editar Gasto"><NuevoGasto /></Layout>} />
            <Route path="/nuevo-servicio" element={<Layout title="Añadir Servicio"><NuevoServicio /></Layout>} />
            <Route path="/editar-servicio/:id" element={<Layout title="Editar Servicio"><NuevoServicio /></Layout>} />
          </Routes>
        </Router>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;

