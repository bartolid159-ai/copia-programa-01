import { useState, useEffect, useCallback } from 'react';
import * as manager from '../../db/manager';
import SecurityModal from '../Common/SecurityModal';
import { login } from '../../auth';

const InvoiceHistory = () => {
  const [facturas, setFacturas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Seguridad y Borrado
  const [securityModal, setSecurityModal] = useState({ isOpen: false, invoiceId: null, error: '' });

  // Estados de Segmentación
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

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

  const loadFacturas = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const results = query.trim()
        ? await manager.searchFacturas(query)
        : await manager.getAllFacturas();
      setFacturas(results || []);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    loadFacturas(q);
    if (q) setSelectedMonth(''); // Si busca manual, quitamos filtro de mes
  };

  const handleMonthChange = (e) => {
    const m = e.target.value;
    setSelectedMonth(m);
    const query = m ? `${selectedYear}-${m}` : selectedYear;
    setSearchQuery(''); // Limpiar búsqueda manual
    loadFacturas(query);
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setSelectedYear(y);
    const query = selectedMonth ? `${y}-${selectedMonth}` : y;
    setSearchQuery('');
    loadFacturas(query);
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
            placeholder="🔍 Buscar por paciente, cédula o teléfono..."
            value={searchQuery}
            onChange={handleSearch}
            id="invoice-history-search"
          />
        </div>

        <div className="segmentation-box">
          <select className="premium-select" value={selectedMonth} onChange={handleMonthChange}>
            <option value="">Todo el año</option>
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
                <th style={{ textAlign: 'center' }}>Acciones</th>
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
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteClick(f.id)}
                      title="Eliminar Factura"
                      style={{ color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)' }}
                    >
                      🗑️
                    </button>
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
        .segmentation-box { display: flex; gap: 10px; }
        
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
      `}</style>
    </div>
  );
};

export default InvoiceHistory;
