import { useState, useEffect } from 'react';
import * as serviceLogic from '../../logic/serviceLogic';

const JornadaForm = ({ onClose, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  const [allServices, setAllServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]); // [{id_servicio, precio_oferta_usd, nombre}]
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await serviceLogic.getServices();
    setAllServices(data);
  };

  const toggleService = (svc) => {
    const exists = selectedServices.find(s => s.id_servicio === svc.id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.id_servicio !== svc.id));
    } else {
      setSelectedServices([...selectedServices, { 
        id_servicio: svc.id, 
        nombre: svc.nombre, 
        precio_original: svc.precio_usd,
        precio_oferta_usd: svc.precio_usd * 0.8 // Sugerir 20% de descuento
      }]);
    }
  };

  const handlePriceChange = (id, newPrice) => {
    setSelectedServices(selectedServices.map(s => 
      s.id_servicio === id ? { ...s, precio_oferta_usd: parseFloat(newPrice) || 0 } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaInicio || !fechaFin) return;
    if (selectedServices.length === 0) return;

    setLoading(true);
    const result = await serviceLogic.registerJornada({
      nombre,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      activa: 1,
      servicios: selectedServices
    });

    if (result.success) {
      onSave();
    } else {
      alert(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glassmorphism animate-in">
        <h3 className="modal-title">Configurar Nueva Jornada</h3>
        
        <form onSubmit={handleSubmit} className="jornada-form">
          <div className="form-section">
            <label>Nombre de la Jornada</label>
            <input 
              type="text" 
              className="inv-input" 
              placeholder="Ej: Jornada Salud 2024" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>Fecha Inicio</label>
              <input 
                type="date" 
                className="inv-input" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="form-section">
              <label>Fecha Fin</label>
              <input 
                type="date" 
                className="inv-input" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <label>Seleccionar Servicios y Precios de Oferta</label>
            <div className="service-selection-list">
              {allServices.map(svc => {
                const isSelected = selectedServices.find(s => s.id_servicio === svc.id);
                return (
                  <div key={svc.id} className={`service-selector-item ${isSelected ? 'selected' : ''}`}>
                    <div className="svc-main" onClick={() => toggleService(svc)}>
                      <input type="checkbox" checked={!!isSelected} readOnly />
                      <div className="svc-info">
                        <span className="svc-name">{svc.nombre}</span>
                        <span className="svc-price-orig">Precio Base: ${svc.precio_usd}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="svc-promo-input">
                        <label>Precio Jornada ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="promo-input"
                          value={isSelected.precio_oferta_usd}
                          onChange={(e) => handlePriceChange(svc.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || selectedServices.length === 0}>
              {loading ? 'Guardando...' : '💾 Guardar Jornada'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 30px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
        }
        .modal-title { margin-bottom: 24px; color: var(--accent-cyan); font-weight: 800; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-section { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .form-section label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        
        .service-selection-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .service-selector-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          transition: all 0.2s;
        }
        .service-selector-item.selected {
          border-color: var(--accent-cyan);
          background: rgba(6,182,212,0.05);
        }
        .svc-main { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .svc-info { display: flex; flex-direction: column; }
        .svc-name { font-weight: 600; font-size: 0.95rem; }
        .svc-price-orig { font-size: 0.75rem; color: var(--text-muted); }
        
        .svc-promo-input {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-color);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .promo-input {
          max-width: 100px;
          padding: 6px 10px;
          border-radius: 6px;
          background: var(--bg-dark);
          border: 1px solid var(--border-color);
          color: var(--accent-cyan);
          font-weight: 700;
        }
        
        .form-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Estilos de Input unificados con el sistema */
        .inv-input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          background: rgba(15, 23, 42, 0.4);
          color: var(--text-main);
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
          width: 100%;
        }
        .inv-input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 2px rgba(6,182,212,0.15);
          background: rgba(15, 23, 42, 0.6);
        }
        
        /* Checkbox Personalizado */
        input[type="checkbox"] {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.5);
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        input[type="checkbox"]:checked {
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
        }
        input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000;
          font-size: 12px;
          font-weight: 900;
        }

        /* Ajuste para inputs de fecha */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.6;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        .promo-input {
          max-width: 100px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-color);
          color: var(--accent-cyan);
          font-weight: 700;
          outline: none;
          transition: all 0.2s;
        }
        .promo-input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 10px rgba(6,182,212,0.2);
        }

        .service-selector-item:hover {
          border-color: rgba(6,182,212,0.3);
          background: rgba(15, 23, 42, 0.5);
        }
      `}</style>
    </div>
  );
};

export default JornadaForm;
