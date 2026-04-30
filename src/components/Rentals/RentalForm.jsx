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

    const result = await alquilerService.registrarAlquiler(formData);
    if (result.success) {
      onSave(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="patient-form-overlay glassmorphism animate-in">
      <div className="patient-form-modal container-card" style={{ maxWidth: '500px' }}>
        <h3>Registrar Alquiler de Consultorio</h3>
        <p className="subtitle">Gestione el cobro de espacios por turnos.</p>

        <form onSubmit={handleSubmit} className="patient-form-grid">
          <div className="form-group full-width">
            <label>Arrendatario (Médico) *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                name="nombre_arrendatario" 
                value={formData.nombre_arrendatario} 
                onChange={handleChange} 
                placeholder="Nombre del médico..."
                style={{ flex: 2 }}
                required 
              />
              <select 
                onChange={handleSelectDoctor} 
                style={{ flex: 1 }}
                value=""
              >
                <option value="">Registrados...</option>
                {availableDoctors.map(doc => (
                  <option key={doc.id} value={doc.nombre}>{doc.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Consultorio *</label>
            <select name="consultorio" value={formData.consultorio} onChange={handleChange} required>
              <option value="Consultorio 1">Consultorio 1</option>
              <option value="Consultorio 2">Consultorio 2</option>
              <option value="Consultorio 3">Consultorio 3</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha *</label>
            <input 
              type="date" 
              name="fecha" 
              value={formData.fecha} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Turno *</label>
            <select name="turno" value={formData.turno} onChange={handleChange} required>
              <option value="MAÑANA">Mañana</option>
              <option value="TARDE">Tarde</option>
              <option value="DÍA COMPLETO">Día Completo</option>
            </select>
          </div>

          <div className="form-group">
            <label>Precio (USD) *</label>
            <input 
              type="number" 
              step="0.01" 
              name="precio_usd" 
              value={formData.precio_usd} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group full-width">
            <label>Método de Pago</label>
            <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange}>
              <option value="EFECTIVO_USD">Efectivo USD</option>
              <option value="EFECTIVO_VES">Efectivo VES</option>
              <option value="PAGO_MOVIL">Pago Móvil</option>
              <option value="TRANSFERENCIA_VES">Transferencia VES</option>
              <option value="ZELLE">Zelle</option>
            </select>
          </div>

          {error && <div className="form-error full-width animate-fade">{error}</div>}

          <div className="form-actions full-width" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Pago</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalForm;
