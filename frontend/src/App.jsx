import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Medicamentos from './pages/Medicamentos';
import './index.css';

function App() {
  // Temporalmente mostraremos Medicamentos para probarlo
  return (
    <>
      <Header />
      <main>
        {/* Cambia <Home /> por <Medicamentos /> para ver el catálogo */}
        <Medicamentos />
      </main>
      <Footer />
    </>
  );
}

export default App;