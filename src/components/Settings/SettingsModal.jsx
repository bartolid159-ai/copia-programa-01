import React, { useState } from 'react';
import { getDb } from '../../db/manager';

const SettingsModal = ({ isOpen, onClose, onShowBanner }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Import dynamic bcrypt for main process compatibility if needed, 
      // but here we are in the renderer. We'll use the service logic.
      const { login } = await import('../../auth');
      
      // Verify current password first
      const authResult = await login('admin', currentPassword);
      
      if (!authResult.success) {
        setError('La contraseña actual es incorrecta');
        setLoading(false);
        return;
      }

      // If correct, update it
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const db = getDb();
      // En modo navegador (LocalStorage)
      if (typeof window !== 'undefined' && !window.process) {
        localStorage.setItem('clinica_admin_password', newPassword); // Simplificado para navegador
      } else {
        // En modo Desktop (SQLite)
        db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, 'admin');
      }

      onShowBanner('Contraseña actualizada exitosamente', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar la contraseña: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card animate-in" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>⚙️ Configuración de Seguridad</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Desde aquí puedes cambiar la contraseña maestra del sistema (Login y Operaciones Críticas).
          </p>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Contraseña Actual</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese clave actual"
                required
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva clave"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita nueva clave"
                required
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Actualizar Clave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
