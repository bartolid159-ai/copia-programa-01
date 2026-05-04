import { useState, useEffect } from 'react';
import * as alquilerService from '../../logic/alquilerService';
import RentalForm from './RentalForm';
import SecurityModal from '../Common/SecurityModal';
import { login } from '../../auth';

const RentalList = ({ onShowBanner }) => {
  const [rentals, setRentals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Seguridad y Borrado
  const [securityModal, setSecurityModal] = useState({ isOpen: false, rentalId: null, error: '' });

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    setLoading(true);
    const data = await alquilerService.getAlquileres();
    setRentals(data);
    setLoading(false);
  };

  const totalIngresos = rentals.reduce((acc, curr) => acc + (Number(curr.precio_usd) || 0), 0);

  const handleSave = (message) => {
    onShowBanner(message);
    setShowForm(false);
    loadRentals();
  };

  const handleDelete = (id) => {
    setSecurityModal({ isOpen: true, rentalId: id, error: '' });
  };

  const handleConfirmDelete = async (password) => {
    try {
      const authResult = await login('admin', password);
      
      if (!authResult.success) {
        setSecurityModal(prev => ({ ...prev, error: 'Clave incorrecta. Acceso denegado.' }));
        return;
      }

      const result = await alquilerService.eliminarAlquiler(securityModal.rentalId);
      if (result.success) {
        setSecurityModal({ isOpen: false, rentalId: null, error: '' });
        onShowBanner(result.message);
        loadRentals();
      }
    } catch (err) {
      console.error('Error al eliminar alquiler:', err);
      setSecurityModal(prev => ({ ...prev, error: 'Error del sistema al procesar el borrado.' }));
    }
  };

  return (
    <div className="patient-list-container animate-in">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Historial de Alquiler de Consultorios</h2>
          <p className="subtitle">Seguimiento de cobros de espacios médicos.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Registrar Alquiler
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="kpi-card glassmorphism animate-fade-in" style={{ padding: '15px 20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Ingresos Totales (Historial)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-cyan)', textShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}>
              ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>USD</span>
          </div>
        </div>
      </div>

      <div className="table-wrapper glassmorphism">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="subtitle">Cargando registros...</p>
          </div>
        ) : rentals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="subtitle">No hay registros de alquileres.</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Consultorio</th>
                <th>Turno</th>
                <th>Arrendatario</th>
                <th>Monto (USD)</th>
                <th>Método de Pago</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map(r => (
                <tr key={r.id} className="animate-fade">
                  <td>{new Date(r.fecha).toLocaleDateString()}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                      {r.consultorio}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${r.turno === 'MAÑANA' ? 'active' : r.turno === 'TARDE' ? 'pending' : 'info'}`}>
                      {r.turno}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{r.nombre_arrendatario}</td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '1rem' }}>
                    ${Number(r.precio_usd).toFixed(2)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{r.metodo_pago}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(r.id)} 
                      title="Eliminar Alquiler"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <RentalForm 
          onSave={handleSave} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      <SecurityModal 
        isOpen={securityModal.isOpen}
        title="Confirmar Borrado de Alquiler"
        message="¿Está seguro que desea eliminar este registro de alquiler? Esta acción revertirá también el asiento contable asociado en el Dashboard."
        error={securityModal.error}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSecurityModal({ isOpen: false, rentalId: null, error: '' })}
      />
    </div>
  );
};

export default RentalList;
