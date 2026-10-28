// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MeSientoMal from './pages/MeSientoMal';
import Cuida from './pages/Cuida';
import Medicamentos from './pages/Medicamentos';
import Login from './pages/Login';
import Preparate from './pages/Preparate';
import Botiquin from './pages/Botiquin'; // <-- AGREGAR ESTA LÍNEA
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mal" element={<MeSientoMal />} />
          <Route path="/cuida" element={<Cuida />} />
          <Route path="/preparate" element={<Preparate />} />
          {/* AGREGAR ESTA RUTA */}
          <Route path="/botiquin" element={<Botiquin />} /> 
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;