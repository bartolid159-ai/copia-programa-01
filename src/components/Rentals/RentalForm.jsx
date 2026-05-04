import { useState, useEffect } from 'react';
import * as alquilerService from '../../logic/alquilerService';
import * as doctorService from '../../logic/doctorService';

const RentalForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre_arrendatario: '',
    consultorio: 'Consultorio 1',
    fecha: new Date().toISOString().split('T')[0],
    turno: 'MAÑANA',
    precio_usd: 20.00,
    metodo_pago: 'EFECTIVO_USD'
  });

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      const doctors = await doctorService.getDoctors();
      setAvailableDoctors(doctors);
    };
    loadDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectDoctor = (e) => {
    const docName = e.target.value;
    if (docName) {
      setFormData(prev => ({ ...prev, nombre_arrendatario: docName }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_arrendatario || !formData.precio_usd) {
      setError('Por favor complete los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await alquilerService.registrarAlquiler(formData);
      if (result.success) {
        onSave(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error inesperado al registrar el alquiler.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay glassmorphism animate-fade">
      <div className="modal-content glassmorphism animate-in" style={{ 
        maxWidth: '520px', 
        width: '95%',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.1)', 
        overflow: 'visible',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Registrar Alquiler</h3>
            <p className="subtitle" style={{ margin: '4px 0 0 0', opacity: 0.7 }}>Gestión de ingresos por espacios médicos</p>
          </div>
          <button className="btn-close" onClick={onCancel} style={{ fontSize: '1.5rem', opacity: 0.5 }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="patient-form-grid" style={{ gap: '1.5rem' }}>
          <div className="form-group full-width">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Arrendatario (Médico) *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px' }}>
              <input 
                type="text" 
                name="nombre_arrendatario" 
                value={formData.nombre_arrendatario} 
                onChange={handleChange} 
                placeholder="Nombre del médico..."
                style={{ width: '100%', boxSizing: 'border-box' }}
                required 
              />
              <select 
                onChange={handleSelectDoctor} 
                style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                value=""
              >
                <option value="" style={{ background: '#1e293b', color: 'white' }}>Cargar...</option>
                {availableDoctors.map(doc => (
                  <option key={doc.id} value={doc.nombre} style={{ background: '#1e293b', color: 'white' }}>{doc.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Consultorio *</label>
            <select name="consultorio" value={formData.consultorio} onChange={handleChange} style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--text-main)' }} required>
              <option value="Consultorio 1" style={{ background: '#1e293b', color: 'white' }}>Consultorio 1</option>
              <option value="Consultorio 2" style={{ background: '#1e293b', color: 'white' }}>Consultorio 2</option>
              <option value="Consultorio 3" style={{ background: '#1e293b', color: 'white' }}>Consultorio 3</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Fecha *</label>
            <input 
              type="date" 
              name="fecha" 
              value={formData.fecha} 
              onChange={handleChange} 
              style={{ width: '100%', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Turno *</label>
            <select name="turno" value={formData.turno} onChange={handleChange} style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--text-main)' }} required>
              <option value="MAÑANA" style={{ background: '#1e293b', color: 'white' }}>Mañana</option>
              <option value="TARDE" style={{ background: '#1e293b', color: 'white' }}>Tarde</option>
              <option value="DÍA COMPLETO" style={{ background: '#1e293b', color: 'white' }}>Día Completo</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Precio (USD) *</label>
            <input 
              type="number" 
              step="0.01" 
              name="precio_usd" 
              value={formData.precio_usd} 
              onChange={handleChange} 
              style={{ width: '100%', boxSizing: 'border-box', color: 'var(--accent-cyan)', fontWeight: 'bold' }}
              required 
            />
          </div>

          <div className="form-group full-width">
            <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Método de Pago</label>
            <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} style={{ width: '100%', background: 'var(--bg-panel)', color: 'var(--text-main)' }}>
              <option value="EFECTIVO_USD" style={{ background: '#1e293b', color: 'white' }}>Efectivo USD</option>
              <option value="EFECTIVO_VES" style={{ background: '#1e293b', color: 'white' }}>Efectivo VES</option>
              <option value="PAGO_MOVIL" style={{ background: '#1e293b', color: 'white' }}>Pago Móvil</option>
              <option value="TRANSFERENCIA_VES" style={{ background: '#1e293b', color: 'white' }}>Transferencia VES</option>
              <option value="ZELLE" style={{ background: '#1e293b', color: 'white' }}>Zelle</option>
            </select>
          </div>

          {error && (
            <div className="full-width" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="form-actions full-width" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalForm;
