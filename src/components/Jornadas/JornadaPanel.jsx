import { useState, useEffect } from 'react';
import * as serviceLogic from '../../logic/serviceLogic';
import JornadaForm from './JornadaForm';
import ConfirmModal from '../Common/ConfirmModal';
import Notification from '../Common/Notification';

const JornadaPanel = () => {
  const [jornadas, setJornadas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadJornadas();
  }, []);

  const loadJornadas = async () => {
    setLoading(true);
    try {
      const data = await serviceLogic.getJornadas();
      setJornadas(data);
    } catch (error) {
      console.error("Error loading jornadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await serviceLogic.deleteJornada(deleteConfirm);
    if (result.success) {
      setNotification({ message: "Jornada eliminada correctamente.", type: "success" });
      loadJornadas();
    } else {
      setNotification({ message: result.message, type: "error" });
    }
    setDeleteConfirm(null);
  };

  const getStatusBadge = (j) => {
    const today = new Date().toISOString().split('T')[0];
    if (!j.activa) return <span className="badge-muted">Inactiva</span>;
    if (today < j.fecha_inicio) return <span className="badge-warning">Programada</span>;
    if (today > j.fecha_fin) return <span className="badge-danger">Finalizada</span>;
    return <span className="badge-success">En Curso</span>;
  };

  return (
    <div className="jornada-panel animate-in">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <header className="panel-header">
        <div className="header-info">
          <h2 className="title-gradient">Jornadas Médicas</h2>
          <p className="subtitle">Configura precios promocionales temporales para tus servicios.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Crear Jornada
        </button>
      </header>

      {loading ? (
        <div className="loading-state">Cargando jornadas...</div>
      ) : jornadas.length === 0 ? (
        <div className="empty-state glassmorphism">
          <div className="empty-icon">📅</div>
          <h3>No hay jornadas registradas</h3>
          <p>Comienza creando una nueva jornada para ofrecer descuentos temporales.</p>
        </div>
      ) : (
        <div className="jornada-grid">
          {jornadas.map(j => (
            <div key={j.id} className="jornada-card glassmorphism">
              <div className="card-status">{getStatusBadge(j)}</div>
              <h3 className="j-title">{j.nombre}</h3>
              <div className="j-dates">
                <div className="date-item">
                  <span className="label">Inicio:</span>
                  <span className="value">{j.fecha_inicio}</span>
                </div>
                <div className="date-item">
                  <span className="label">Fin:</span>
                  <span className="value">{j.fecha_fin}</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn-delete-card" onClick={() => setDeleteConfirm(j.id)}>Quitar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <JornadaForm 
          onClose={() => setShowForm(false)} 
          onSave={() => {
            setShowForm(false);
            loadJornadas();
            setNotification({ message: "Jornada creada con éxito.", type: "success" });
          }}
        />
      )}

      <ConfirmModal 
        isOpen={!!deleteConfirm}
        title="Eliminar Jornada"
        message="¿Estás seguro de que deseas eliminar esta jornada? Los servicios volverán a sus precios originales inmediatamente."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        type="danger"
      />

      <style jsx>{`
        .jornada-panel {
          padding: 10px;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .jornada-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .jornada-card {
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          position: relative;
          transition: transform 0.2s, border-color 0.2s;
        }
        .jornada-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-cyan);
        }
        .card-status {
          position: absolute;
          top: 20px;
          right: 20px;
        }
        .j-title {
          font-size: 1.2rem;
          margin-bottom: 16px;
          color: var(--accent-cyan);
          font-weight: 700;
        }
        .j-dates {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.03);
          padding: 12px;
          border-radius: 10px;
        }
        .date-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .label { color: var(--text-muted); }
        .value { font-weight: 600; }
        
        .badge-success { background: rgba(16,185,129,0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .badge-muted { background: rgba(107,114,128,0.15); color: #9ca3af; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

        .card-actions {
          display: flex;
          justify-content: flex-end;
        }
        .btn-delete-card {
          background: transparent;
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete-card:hover {
          background: #ef4444;
          color: #000;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          border-radius: 20px;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 20px; }
      `}</style>
    </div>
  );
};

export default JornadaPanel;
