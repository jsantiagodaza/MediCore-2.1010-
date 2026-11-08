// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { saveSession } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();

  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const esRegistro = modo === 'registro';

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (esRegistro && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    try {
      if (esRegistro) {
        await apiRegister({
          email: email.trim(),
          password,
          name: nombre.trim() || null
        });
      }

      const sesion = await apiLogin(email.trim(), password);
      saveSession(sesion);
      navigate('/');
      window.location.reload(); // Recarga para actualizar el Header
    } catch (err) {
      setError(err.message ?? 'No se pudo completar la operación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="screen on" style={{ padding: 0, minHeight: '100vh', display: 'flex' }}>
      
      {/* LADO IZQUIERDO: Formulario */}
      <div className="login-left">
        <div className="login-form-wrapper">
          
          <div className="center" style={{ marginBottom: '32px' }}>
            <img src="/assets/mol-verde.png" alt="Mol" style={{ width: '75px', height: '85px', marginBottom: '16px' }} className="float" />
            <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>
              {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
            </h2>
            <p style={{ color: 'var(--color-slate-gray)', fontSize: '15px' }}>
              {esRegistro
                ? 'Regístrate para guardar tu historial y acceder a herramientas personalizadas.'
                : 'Inicia sesión para guardar tu historial y acceder a herramientas personalizadas.'}
            </p>
          </div>

          {error && (
            <div className="warn" style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            {esRegistro && (
              <label>
                Nombre (Completo)
                <input
                  type="text"
                  placeholder="ej. Jainer Enrique Cuello Castilla"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={cargando}
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Correo electrónico
              <input
                type="email"
                placeholder="ej. jainer@medicore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={cargando}
                autoComplete="email"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
              />
            </label>

            {esRegistro && (
              <small style={{ color: 'var(--color-slate-gray)', fontSize: '12px', marginTop: '-10px' }}>
                Mínimo 8 caracteres.
              </small>
            )}

            <button
              type="submit"
              className="btn btn-primary full"
              disabled={cargando}
              style={{ marginTop: '10px', opacity: cargando ? 0.7 : 1, height: '48px' }}
            >
              {cargando
                ? (esRegistro ? 'Creando cuenta...' : 'Iniciando sesión...')
                : (esRegistro ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>
          </form>

          <div className="center" style={{ marginTop: '24px', fontSize: '14px', color: 'var(--color-slate-gray)' }}>
            {esRegistro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button
              type="button"
              onClick={() => cambiarModo(esRegistro ? 'login' : 'registro')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-signal-blue)',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            >
              {esRegistro ? 'Inicia sesión' : 'Regístrate aquí'}
            </button>
          </div>

        </div>
      </div>

      {/* LADO DERECHO: Visual / Video */}
      <div className="login-right">
        <video
          className="login-bg-video"
          src="/assets/fondoinicio3.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="login-bg-overlay"></div>
        
        <div className="login-right-content">
          <span className="kicker" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="kicker-dot" style={{ background: 'white' }}></span>
            MediCore 2.0
          </span>
          <h2 style={{ color: 'white', fontSize: 'clamp(32px, 4vw, 48px)', marginBottom: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Tu salud, simple y segura.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', maxWidth: '400px', lineHeight: '1.5' }}>
            Accede a tu historial de medicamentos, calculadoras de salud y herramientas personalizadas con la compañía de Mol.
          </p>
        </div>
      </div>

    </section>
  );
}