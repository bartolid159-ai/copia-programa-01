import { useState, useEffect, useCallback } from 'react';
import * as manager from '../../db/manager';
import SecurityModal from '../Common/SecurityModal';
import { login } from '../../auth';
import logoPrincipal from '../../assets/logo.png';

const InvoiceHistory = () => {
  const [facturas, setFacturas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Seguridad y Borrado
  const [securityModal, setSecurityModal] = useState({ isOpen: false, invoiceId: null, error: '' });

  // Estados de Segmentación
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estado para Detalle/Impresión
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const meses = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  const currentYear = new Date().getFullYear();
  const años = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const loadFacturas = useCallback(async (query = '', start = '', end = '') => {
    setIsLoading(true);
    try {
      // Priorizar el nuevo método de historial que soporta filtros avanzados
      const results = await manager.getHistorialFacturas({
        searchQuery: query,
        startDate: start,
        endDate: end
      });
      setFacturas(results || []);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacturas(searchQuery, startDate, endDate);
  }, [loadFacturas, searchQuery, startDate, endDate]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleMonthChange = (e) => {
    const m = e.target.value;
    setSelectedMonth(m);
    if (m) {
      setStartDate(`${selectedYear}-${m}-01`);
      // Obtener último día del mes
      const lastDay = new Date(selectedYear, m, 0).getDate();
      setEndDate(`${selectedYear}-${m}-${lastDay}`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setSelectedYear(y);
    if (selectedMonth) {
      setStartDate(`${y}-${selectedMonth}-01`);
      const lastDay = new Date(y, selectedMonth, 0).getDate();
      setEndDate(`${y}-${selectedMonth}-${lastDay}`);
    }
  };

  const handleDeleteClick = (id) => {
    setSecurityModal({ isOpen: true, invoiceId: id, error: '' });
  };

  const handleConfirmDelete = async (password) => {
    try {
      // Validamos contra el usuario administrador
      const authResult = await login('admin', password);
      
      if (!authResult.success) {
        setSecurityModal(prev => ({ ...prev, error: 'Clave incorrecta. Acceso denegado.' }));
        return;
      }

      const result = await manager.deleteFactura(securityModal.invoiceId);
      if (result.success) {
        setSecurityModal({ isOpen: false, invoiceId: null, error: '' });
        loadFacturas(searchQuery);
      }
    } catch (err) {
      console.error('Error al eliminar factura:', err);
      setSecurityModal(prev => ({ ...prev, error: 'Error del sistema al procesar el borrado.' }));
    }
  };

  const handleViewInvoice = async (id) => {
    try {
      const fact = await manager.getFacturaById(id);
      const dets = await manager.getFacturaDetalles(id);
      
      const items = (dets || []).map(item => ({
        ...item,
        precio_final: Number(item.precio_unitario_usd || item.precio_usd || item.precio || 0)
      }));

      const subtotal = items.reduce((sum, item) => sum + (Number(item.cantidad || 0) * item.precio_final), 0);
      
      // IVA dinámico: Sumar solo lo que especifica cada item en iva_porcentaje
      const iva = items.reduce((sum, item) => {
        const pct = Number(item.iva_porcentaje || 0);
        return sum + (Number(item.cantidad || 0) * item.precio_final * (pct / 100));
      }, 0);
      
      // El total se basa en el subtotal + IVA calculado, a menos que el guardado sea mayor
      const total_usd = Math.max(fact.total_usd || 0, subtotal + iva);

      const enrichedFact = {
        ...fact,
        subtotal_usd: subtotal,
        iva_usd: iva,
        total_usd: total_usd,
        total_ves: total_usd * (fact.tasa_cambio || 1)
      };

      setSelectedInvoice(enrichedFact);
      setInvoiceDetails(items);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error al cargar detalles de factura:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="patient-list animate-in">

      {/* Buscador y Filtros */}
      <div className="history-filters-container">
        <div className="search-box">
          <input
            type="text"
            className="premium-input"
            placeholder="Buscar por paciente, cedula o telefono..."
            value={searchQuery}
            onChange={handleSearch}
            id="invoice-history-search"
          />
        </div>

        <div className="segmentation-box">
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label>Desde:</label>
              <input 
                type="date" 
                className="premium-input date-picker" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setSelectedMonth(''); }}
              />
            </div>
            <div className="date-input-group">
              <label>Hasta:</label>
              <input 
                type="date" 
                className="premium-input date-picker" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setSelectedMonth(''); }}
              />
            </div>
          </div>

          <select className="premium-select" value={selectedMonth} onChange={handleMonthChange}>
            <option value="">Mes específico...</option>
            {meses.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select className="premium-select" value={selectedYear} onChange={handleYearChange}>
            {años.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal de Detalle / Recibo (Refactorizado Estilo Premium) */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content recibo-modal glassmorphism" style={{ maxWidth: '500px', background: 'var(--bg-panel)', padding: '30px' }}>
            <div className="recibo-container-printable" id="printable-receipt">
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  display: 'inline-block', 
                  marginBottom: '15px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                  <img 
                    src="/images/1.png" 
                    alt="Logo Imagen & Salud" 
                    style={{ maxHeight: '60px', display: 'block' }} 
                  />
                </div>
                <h1 style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', margin: 0, letterSpacing: '2px' }}>FACTURA DE SERVICIOS</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '5px' }}>Imagen & Salud · Gestión Médica</p>
                <div style={{ marginTop: '15px', fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>COMPROBANTE #{String(selectedInvoice.id).padStart(5, '0')}</div>
              </div>

              <div className="recibo-body" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Fecha de Emisión</span>
                   <span>{formatDate(selectedInvoice.fecha)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Paciente</span>
                   <span style={{ fontWeight: 600 }}>{selectedInvoice.paciente_nombre}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Cédula / RIF</span>
                   <span>{selectedInvoice.paciente_cedula || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Médico Tratante</span>
                   <span style={{ color: 'var(--accent-yellow)' }}>{selectedInvoice.medico_nombre || 'No asignado'}</span>
                </div>
                
                <div style={{ margin: '20px 0' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>Detalle de Servicios</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)' }}>Descripción</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-muted)' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetails.map((det, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 0' }}>
                            {det.servicio_nombre || 'Servicio'} 
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '5px' }}>x{det.cantidad}</span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-main)' }}>
                            ${((det.precio_final || 0) * Number(det.cantidad || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ margin: '20px 0', padding: '15px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>${Number(selectedInvoice.subtotal_usd || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{selectedInvoice.iva_usd > 0 ? 'IVA (16%):' : 'IVA (0%):'}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>${Number(selectedInvoice.iva_usd || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(6, 182, 212, 0.3)', paddingTop: '10px', marginTop: '5px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>TOTAL A PAGAR:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>${Number(selectedInvoice.total_usd || 0).toFixed(2)} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--accent-yellow)', marginTop: '8px', fontWeight: 600 }}>
                    <span>Tasa: {selectedInvoice.tasa_cambio || '—'}</span>
                    <span>Total VES: Bs. {Number(selectedInvoice.total_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '3px' }}>Método</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedInvoice.metodo_pago?.replace(/_/g, ' ')}</div>
                  </div>
                  {selectedInvoice.detalle_pago && (
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '3px' }}>Referencia</div>
                      <div style={{ fontSize: '0.85rem' }}>{selectedInvoice.detalle_pago}</div>
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Gracias por preferir nuestros servicios profesionales.
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
               <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handlePrint}>🖨️ Imprimir Factura</button>
               <button className="btn-secondary" style={{ padding: '12px' }} onClick={() => setIsDetailModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Contador */}
      <div style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {isLoading ? 'Cargando...' : `${facturas.length} factura${facturas.length !== 1 ? 's' : ''} encontrada${facturas.length !== 1 ? 's' : ''}`}
      </div>

      {/* Tabla */}
      {!isLoading && facturas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <p style={{ fontSize: '1.1rem' }}>
            {searchQuery ? 'No se encontraron facturas para esta búsqueda.' : 'Aún no hay facturas registradas.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper glassmorphism">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Total USD</th>
                <th>Total VES</th>
                <th>Pago</th>
                <th>Ref / Detalle</th>
                <th>Estatus</th>
                <th style={{ textAlign: 'center', minWidth: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{String(f.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.87rem', whiteSpace: 'nowrap' }}>
                    {formatDate(f.fecha)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{f.paciente_nombre || '—'}</td>
                  <td>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      ${Number(f.total_usd || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>
                      Bs.{Number(f.total_ves || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {f.metodo_pago === 'TRANSFERENCIA' && (
                        <span className="status-badge" style={{ background: 'rgba(56, 182, 255, 0.1)', color: '#38b6ff', border: '1px solid #38b6ff' }}>
                          🏦 Transf
                        </span>
                      )}
                      {f.metodo_pago === 'PAGO_MOVIL' && (
                        <span className="status-badge" style={{ background: 'rgba(255, 158, 0, 0.1)', color: '#ff9e00', border: '1px solid #ff9e00' }}>
                          📱 Móvil
                        </span>
                      )}
                      {f.metodo_pago === 'EFECTIVO_USD' && (
                        <span className="status-badge" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid #4ade80' }}>
                          💵 Efectivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {f.detalle_pago || '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${f.estatus === 'PAGADA' ? 'active' : 'inactive'}`}>
                      {f.estatus || 'PAGADA'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleViewInvoice(f.id)}
                        title="Ver Detalles / Imprimir"
                        style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                      >
                        📄
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDeleteClick(f.id)}
                        title="Eliminar Factura"
                        style={{ color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SecurityModal 
        isOpen={securityModal.isOpen}
        title="Confirmar Borrado de Factura"
        message={`¿Está seguro que desea eliminar la factura #${String(securityModal.invoiceId).padStart(4, '0')}? Esta acción eliminará también los asientos contables asociados.`}
        error={securityModal.error}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSecurityModal({ isOpen: false, invoiceId: null, error: '' })}
      />
      <style jsx>{`
        .history-filters-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .search-box { flex: 1; min-width: 300px; }
        .segmentation-box { display: flex; gap: 10px; align-items: center; }
        .date-range-inputs { display: flex; gap: 12px; align-items: center; }
        .date-input-group { display: flex; align-items: center; gap: 8px; }
        .date-input-group label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
        .date-picker { padding: 8px 12px; font-size: 0.85rem; width: auto; }
        
        .premium-input, .premium-select {
          padding: 10px 16px;
          border: 1px solid var(--border-color);
          background: rgba(15, 23, 42, 0.4);
          color: var(--text-main);
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }
        .premium-input { width: 100%; }
        .premium-input:focus, .premium-select:focus {
          border-color: var(--accent-cyan);
          background: rgba(15, 23, 42, 0.6);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
        }
        
        .premium-select {
          cursor: pointer;
          appearance: none;
          padding-right: 36px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .premium-select option {
          background: #0f172a;
          color: white;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-badge.active { background: rgba(16,185,129,0.15); color: #10b981; }
        .status-badge.inactive { background: rgba(239,68,68,0.15); color: #ef4444; }

        .btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          transform: scale(1.1);
        }

        /* Estilos Recibo e Impresión Refactorizados */
        .recibo-modal {
          background: var(--bg-panel);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        @media print {
          @page { size: auto; margin: 0; }
          body * { visibility: hidden; }
          .recibo-modal, .recibo-modal * { visibility: visible; }
          .recibo-modal {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 1.5cm;
            background: #fff !important;
            color: #000 !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          .recibo-container-printable {
             width: 100% !important;
             max-width: none !important;
             margin: 0 auto !important;
             padding: 0 !important;
             color: #000 !important;
             background: #fff !important;
          }
          .recibo-container-printable * { 
            color: #000 !important; 
            border-color: #eee !important;
          }
          .modal-footer, .btn-primary, .btn-secondary, .no-print {
            display: none !important;
          }
          /* Asegurar que el logo sea visible en impresión */
          img { filter: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceHistory;
