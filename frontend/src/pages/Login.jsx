// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 1. Validaciones básicas
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // 2. Simulación de envío al Backend
    setIsLoading(true);
    
    setTimeout(() => {
      // Simulamos que el backend rechaza credenciales incorrectas
      if (email !== 'demo@medicore.com' || password !== '123456') {
        setError('Credenciales incorrectas. Intenta con demo@medicore.com y 123456');
        setIsLoading(false);
        return;
      }

      // Simulamos éxito
      localStorage.setItem('medicore_token', 'fake-jwt-token-12345');
      localStorage.setItem('medicore_user', email);
      setIsLoading(false);
      
      // Redirigimos al inicio
      navigate('/');
      // Opcional: recargar la página para que el Header detecte el login
      window.location.reload(); 
    }, 1500); // Simulamos 1.5 segundos de espera
  };

  return (
    <section className="screen on" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px 32px' }}>
        
        <div className="center" style={{ marginBottom: '24px' }}>
          <img src="/assets/mol.png" alt="Mol" style={{ width: '80px', height: '80px', marginBottom: '16px' }} className="float" />
          <h2 style={{ fontSize: '28px' }}>Bienvenido de nuevo</h2>
          <p style={{ color: 'var(--color-slate-gray)', fontSize: '14px' }}>Inicia sesión para guardar tu historial y acceder a herramientas personalizadas.</p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="warn" style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input 
              type="email" 
              placeholder="ej. demo@medicore.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <label>
            Contraseña
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <button 
            type="submit" 
            className="btn btn-primary full" 
            disabled={isLoading}
            style={{ marginTop: '10px', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="center" style={{ marginTop: '24px', fontSize: '14px', color: 'var(--color-slate-gray)' }}>
          ¿No tienes cuenta? <Link to="#" style={{ fontWeight: 'bold' }}>Regístrate aquí</Link>
        </div>

      </div>
    </section>
  );
}