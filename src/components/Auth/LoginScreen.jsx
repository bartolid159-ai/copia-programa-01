import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { login } from '../../auth';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el sistema de seguridad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card animate-in">
        <div className="login-header">
          <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
            <img src="/images/1.png" alt="Logo Imagen & Salud" style={{ width: '100%', maxWidth: '280px', height: 'auto' }} />
          </div>
          <h1>Bienvenido de nuevo</h1>
          <p>Ingrese sus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button 
            type="submit" 
            className="btn-primary login-btn" 
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} imagen y salud systems - Local-First Accounting</p>
        </div>
      </div>

      <style jsx>{`
        .login-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 3rem;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1rem;
          letter-spacing: -1px;
        }

        .login-logo span {
          color: var(--accent-cyan, #06B6D4);
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: var(--text-muted, #94A3B8);
          font-size: 0.9rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          text-align: center;
        }

        .login-btn {
          margin-top: 1rem;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          color: rgba(148, 163, 184, 0.5);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
