// frontend/src/App.jsx
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './index.css'; // Aseguramos que los estilos se carguen

function App() {
  return (
    <>
      <Header />
      <main>
        <Home />
      </main>
      <Footer />
    </>
  );
}

export default App;