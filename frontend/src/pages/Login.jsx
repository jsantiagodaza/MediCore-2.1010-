// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { saveSession } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();

  // 'login' para iniciar sesion, 'registro' para crear cuenta
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

    // Validaciones basicas en el navegador (el backend las repite)
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

      // Si el registro salio bien, iniciamos sesion automaticamente
      const sesion = await apiLogin(email.trim(), password);
      saveSession(sesion);
      navigate('/');
    } catch (err) {
      setError(err.message ?? 'No se pudo completar la operación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="screen on" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px 32px' }}>

        <div className="center" style={{ marginBottom: '24px' }}>
          <img src="/assets/mol.png" alt="Mol" style={{ width: '80px', height: '80px', marginBottom: '16px' }} className="float" />
          <h2 style={{ fontSize: '28px' }}>{esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h2>
          <p style={{ color: 'var(--color-slate-gray)', fontSize: '14px' }}>
            {esRegistro
              ? 'Regístrate para guardar tu historial y acceder a herramientas personalizadas.'
              : 'Inicia sesión para guardar tu historial y acceder a herramientas personalizadas.'}
          </p>
        </div>

        {/* Alertas del backend: credenciales inválidas, email ya registrado, etc. */}
        {error && (
          <div className="warn" style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {esRegistro && (
            <label>
              Nombre (opcional)
              <input
                type="text"
                placeholder="ej. Jainer"
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
            <small style={{ color: 'var(--color-slate-gray)', fontSize: '12px' }}>
              Mínimo 8 caracteres.
            </small>
          )}

          <button
            type="submit"
            className="btn btn-primary full"
            disabled={cargando}
            style={{ marginTop: '10px', opacity: cargando ? 0.7 : 1 }}
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
    </section>
  );
}
