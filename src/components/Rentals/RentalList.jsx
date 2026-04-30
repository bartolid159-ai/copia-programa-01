import { useState, useEffect } from 'react';
import * as alquilerService from '../../logic/alquilerService';
import RentalForm from './RentalForm';

const RentalList = ({ onShowBanner }) => {
  const [rentals, setRentals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    setLoading(true);
    const data = await alquilerService.getAlquileres();
    setRentals(data);
    setLoading(false);
  };

  const handleSave = (message) => {
    onShowBanner(message);
    setShowForm(false);
    loadRentals();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro de alquiler? Se revertirá también el asiento contable.')) {
      const result = await alquilerService.eliminarAlquiler(id);
      if (result.success) {
        onShowBanner(result.message);
        loadRentals();
      }
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

      <div className="container-card">
        {loading ? (
          <p>Cargando registros...</p>
        ) : rentals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p className="subtitle">No hay registros de alquileres.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Consultorio</th>
                  <th>Turno</th>
                  <th>Arrendatario</th>
                  <th>Precio (USD)</th>
                  <th>Método</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id} className="animate-fade">
                    <td>{new Date(r.fecha).toLocaleDateString()}</td>
                    <td><span className="badge-status info">{r.consultorio}</span></td>
                    <td>{r.turno}</td>
                    <td style={{ fontWeight: '600' }}>{r.nombre_arrendatario}</td>
                    <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                      ${Number(r.precio_usd).toFixed(2)}
                    </td>
                    <td>{r.metodo_pago}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDelete(r.id)} title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <RentalForm 
          onSave={handleSave} 
          onCancel={() => setShowForm(false)} 
        />
      )}
    </div>
  );
};

export default RentalList;
