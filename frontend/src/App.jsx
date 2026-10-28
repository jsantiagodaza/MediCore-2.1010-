// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MeSientoMal from './pages/MeSientoMal';
import Medicamentos from './pages/Medicamentos';
import Login from './pages/Login'; // <-- Importar
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/login" element={<Login />} /> {/* <-- Nueva ruta */}
          <Route path="/mal" element={<MeSientoMal />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;