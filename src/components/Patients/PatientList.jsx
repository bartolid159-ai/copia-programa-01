import { useState, useEffect, useCallback } from 'react';
import * as patientService from '../../logic/patientService.js';
import SecurityModal from '../Common/SecurityModal';
import { login } from '../../auth';

const PatientList = ({ onAddClick, onEditClick }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Seguridad y Borrado
  const [securityModal, setSecurityModal] = useState({ isOpen: false, patientId: null, patientName: '', error: '' });

  const fetchPatients = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const results = query.trim() 
        ? await patientService.searchPatients(query)
        : await patientService.getPatients();
      setPatients(results || []);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients(searchTerm);
  }, [searchTerm, fetchPatients]);

  const handleDeleteClick = (patient) => {
    setSecurityModal({ 
      isOpen: true, 
      patientId: patient.id, 
      patientName: patient.nombre, 
      error: '' 
    });
  };

  const handleConfirmDelete = async (password) => {
    try {
      // Validamos contra el usuario administrador
      const authResult = await login('admin', password);
      
      if (!authResult.success) {
        setSecurityModal(prev => ({ ...prev, error: 'Clave incorrecta. Acceso denegado.' }));
        return;
      }

      const result = await patientService.deletePatient(securityModal.patientId);
      if (result.success) {
        setSecurityModal({ isOpen: false, patientId: null, patientName: '', error: '' });
        fetchPatients(searchTerm);
      } else {
        setSecurityModal(prev => ({ ...prev, error: result.message || 'Error al eliminar.' }));
      }
    } catch (err) {
      console.error('Error al eliminar paciente:', err);
      setSecurityModal(prev => ({ ...prev, error: 'Error del sistema al procesar el borrado.' }));
    }
  };

  return (
    <div className="patient-list animate-fade">
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input glassmorphism"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-primary" onClick={onAddClick}>+ Nuevo Paciente</button>
      </div>

      <div className="table-wrapper glassmorphism">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula / RIF</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Fecha Nac.</th>
              <th>Sexo</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No se encontraron pacientes.</td></tr>
            ) : (
              patients.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.cedula_rif}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.correo || '-'}</td>
                  <td>{p.fecha_nacimiento}</td>
                  <td>{p.sexo}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn-icon" 
                        title="Editar Paciente" 
                        onClick={() => onEditClick(p)}
                        style={{ color: 'var(--accent-cyan)', background: 'rgba(56, 182, 255, 0.1)', border: '1px solid rgba(56, 182, 255, 0.2)' }}
                      >
                        📄
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar Paciente" 
                        onClick={() => handleDeleteClick(p)}
                        style={{ color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SecurityModal 
        isOpen={securityModal.isOpen}
        title="Confirmar Borrado de Paciente"
        message={`¿Está seguro que desea eliminar al paciente "${securityModal.patientName}"? Esta acción es IRREVERSIBLE y eliminará también todo su historial de facturas y registros contables asociados.`}
        error={securityModal.error}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSecurityModal({ isOpen: false, patientId: null, patientName: '', error: '' })}
      />
    </div>
  );
};

export default PatientList;
