import { useState, useEffect } from 'react';
import { 
  getGastoTemplates, 
  insertGastoTemplate, 
  deleteGastoTemplate, 
  insertAsientoManual,
  getHistorialEgresos,
  getCategoriasGastos,
  insertCategoriaGasto
} from '../../db/manager';

const ExpensesModule = ({ onShowBanner }) => {
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'history', 'templates'
  const [templates, setTemplates] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  // Plantilla en creación
  const [newTemplate, setNewTemplate] = useState({ 
    nombre: '', 
    items: [] 
  });
  
  // Gasto único o Lote en proceso
  const [batchExpenses, setBatchExpenses] = useState([{
    descripcion: '',
    monto_usd: '',
    categoria: 'GASTO_OPERATIVO',
    id: Date.now()
  }]);
  
  const [fechaComun, setFechaComun] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadInitialData = async () => {
    const t = await getGastoTemplates();
    const c = await getCategoriasGastos();
    setTemplates(t || []);
    setAvailableCategories(c || []);
  };

  const loadHistory = async () => {
    const data = await getHistorialEgresos();
    setHistorial(data || []);
  };

  const handleAddBatchRow = () => {
    setBatchExpenses([...batchExpenses, {
      descripcion: '',
      monto_usd: '',
      categoria: 'GASTO_OPERATIVO',
      id: Date.now()
    }]);
  };

  const handleRemoveBatchRow = (id) => {
    if (batchExpenses.length === 1) return;
    setBatchExpenses(batchExpenses.filter(b => b.id !== id));
  };

  const updateBatchRow = (id, field, value) => {
    setBatchExpenses(batchExpenses.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleRegistrarLote = async (e) => {
    e.preventDefault();
    let count = 0;
    
    for (const item of batchExpenses) {
      if (!item.descripcion || !item.monto_usd) continue;
      
      const data = {
        tipo: 'EGRESO',
        categoria: item.categoria,
        debe_usd: 0,
        haber_usd: parseFloat(item.monto_usd),
        debe_ves: 0,
        haber_ves: 0, 
        tasa_referencia: 1,
        descripcion: item.descripcion,
        fecha: fechaComun + 'T12:00:00'
      };
      await insertAsientoManual(data);
      count++;
    }

    if (count > 0) {
      setBatchExpenses([{ descripcion: '', monto_usd: '', categoria: 'GASTO_OPERATIVO', id: Date.now() }]);
      onShowBanner(`${count} egreso(s) registrado(s) exitosamente`, 'success');
      if (activeTab === 'history') loadHistory();
    }
  };

  const handleSaveCategory = async () => {
    if (!newCatName) return;
    await insertCategoriaGasto(newCatName);
    const c = await getCategoriasGastos();
    setAvailableCategories(c);
    setNewCatName('');
    setShowCategoryModal(false);
    onShowBanner('Categoría guardada', 'success');
  };

  const handleSaveMultiTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.nombre || newTemplate.items.length === 0) {
      onShowBanner('La plantilla necesita un nombre e ítems', 'error');
      return;
    }
    
    await insertGastoTemplate({
      nombre: newTemplate.nombre,
      items_json: JSON.stringify(newTemplate.items),
      monto_estimado_usd: newTemplate.items.reduce((acc, i) => acc + parseFloat(i.monto || 0), 0)
    });
    
    setNewTemplate({ nombre: '', items: [] });
    setShowTemplateForm(false);
    loadInitialData();
    onShowBanner('Plantilla múltiple guardada', 'success');
  };

  const handleCargarTemplate = (t) => {
    try {
      if (t.items_json) {
        const items = JSON.parse(t.items_json);
        setBatchExpenses(items.map(i => ({
          descripcion: i.descripcion,
          monto_usd: i.monto,
          categoria: i.categoria,
          id: Math.random()
        })));
      } else {
        // Fallback para plantillas viejas (un solo ítem)
        setBatchExpenses([{
          descripcion: t.nombre,
          monto_usd: t.monto_estimado_usd,
          categoria: t.categoria,
          id: Date.now()
        }]);
      }
      setActiveTab('register');
      onShowBanner(`Plantilla "${t.nombre}" cargada`, 'info');
    } catch (e) {
      onShowBanner('Error al cargar plantilla', 'error');
    }
  };

  return (
    <div className="card glass-card fade-in" style={{ padding: '24px', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Submódulo de Gastos</h3>
        <div className="tab-buttons" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
          {['register', 'history', 'templates'].map(tab => (
            <button 
              key={tab}
              type="button"
              className={`btn-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'register' ? 'Registrar' : tab === 'history' ? 'Historial' : 'Plantillas'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'register' && (
        <form onSubmit={handleRegistrarLote}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
             <div className="form-group" style={{ width: '200px' }}>
                <label style={{ fontSize: '0.8rem' }}>Fecha General</label>
                <input type="date" className="form-control" value={fechaComun} onChange={e => setFechaComun(e.target.value)} />
             </div>
             <button type="button" className="btn-secondary" style={{ height: 'fit-content', alignSelf: 'flex-end' }} onClick={() => setShowCategoryModal(true)}>
                + Nueva Categoría
             </button>
          </div>

          <div className="batch-container" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Descripción / Concepto</th>
                  <th style={{ width: '20%' }}>Monto ($)</th>
                  <th style={{ width: '25%' }}>Categoría</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {batchExpenses.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={row.descripcion} 
                        onChange={e => updateBatchRow(row.id, 'descripcion', e.target.value)}
                        placeholder="Concepto del gasto..."
                        required
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        value={row.monto_usd} 
                        onChange={e => updateBatchRow(row.id, 'monto_usd', e.target.value)}
                        placeholder="0.00"
                        required
                        style={{ width: '100%', fontWeight: 'bold' }}
                      />
                    </td>
                    <td>
                      <select 
                        className="form-control" 
                        value={row.categoria} 
                        onChange={e => updateBatchRow(row.id, 'categoria', e.target.value)}
                        style={{ width: '100%' }}
                      >
                        {availableCategories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" className="btn-delete" onClick={() => handleRemoveBatchRow(row.id)} title="Eliminar fila">
                        <span style={{ fontSize: '1.2rem' }}>×</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleAddBatchRow}>
              + Añadir otra fila
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              Registrar Todos los Gastos
            </button>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="fade-in">
          <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table className="modern-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                <tr>
                  <th style={{ width: '15%' }}>Fecha</th>
                  <th style={{ width: '45%' }}>Concepto / Descripción</th>
                  <th style={{ width: '20%' }}>Categoría</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Monto ($)</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                      <div style={{ opacity: 0.3, fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                      No hay gastos registrados en el sistema.
                    </td>
                  </tr>
                )}
                {historial.map(g => (
                  <tr key={g.id} className="row-hover">
                    <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{new Date(g.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ fontWeight: '500' }}>{g.descripcion}</td>
                    <td><span className="badge-category">{g.categoria?.replace(/_/g, ' ')}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#ff4d4d', fontSize: '1.05rem' }}>-${parseFloat(g.haber_usd).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="fade-in">
          {!showTemplateForm ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button type="button" className="btn-primary" onClick={() => setShowTemplateForm(true)}>
                  + Crear Plantilla Nueva
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {templates.map(t => (
                  <div key={t.id} className="glass-item" style={{ padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                          <h4 style={{ margin: '0 0 4px 0' }}>{t.nombre}</h4>
                          <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>
                             {t.items_json ? `${JSON.parse(t.items_json).length} ítems` : '1 ítem'} • Est: ${t.monto_estimado_usd}
                          </p>
                       </div>
                       <button type="button" className="btn-icon-danger" onClick={() => {
                          if(confirm('¿Eliminar plantilla?')) deleteGastoTemplate(t.id).then(loadInitialData);
                       }}>×</button>
                    </div>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem' }}
                      onClick={() => handleCargarTemplate(t)}
                    >
                      Cargar en Registro
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveMultiTemplate}>
               <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Nombre de la Plantilla</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Gastos Fijos Mensuales" 
                    value={newTemplate.nombre}
                    onChange={e => setNewTemplate({...newTemplate, nombre: e.target.value})}
                    required
                  />
               </div>
               <div className="template-items-builder" style={{ marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>Ítems de la Plantilla</label>
                  {newTemplate.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                       <input 
                        type="text" 
                        placeholder="Descripción" 
                        className="form-control" 
                        value={item.descripcion}
                        onChange={e => {
                          const newItems = [...newTemplate.items];
                          newItems[idx].descripcion = e.target.value;
                          setNewTemplate({...newTemplate, items: newItems});
                        }}
                       />
                       <input 
                        type="number" 
                        placeholder="Monto" 
                        className="form-control" style={{ width: '100px' }}
                        value={item.monto}
                        onChange={e => {
                          const newItems = [...newTemplate.items];
                          newItems[idx].monto = e.target.value;
                          setNewTemplate({...newTemplate, items: newItems});
                        }}
                       />
                       <select 
                        className="form-control" style={{ width: '140px' }}
                        value={item.categoria}
                        onChange={e => {
                          const newItems = [...newTemplate.items];
                          newItems[idx].categoria = e.target.value;
                          setNewTemplate({...newTemplate, items: newItems});
                        }}
                       >
                          {availableCategories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                       </select>
                       <button type="button" className="btn-icon-danger" onClick={() => {
                          const newItems = newTemplate.items.filter((_, i) => i !== idx);
                          setNewTemplate({...newTemplate, items: newItems});
                       }}>×</button>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => {
                    setNewTemplate({
                      ...newTemplate, 
                      items: [...newTemplate.items, { descripcion: '', monto: '', categoria: 'GASTO_OPERATIVO' }]
                    });
                  }}>
                    + Añadir ítem a la plantilla
                  </button>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowTemplateForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>Guardar Plantilla</button>
               </div>
            </form>
          )}
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay">
           <div className="modal-content glass-card">
              <h4>Añadir Nueva Categoría</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Define una nueva etiqueta para clasificar tus gastos.</p>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nombre de la categoría..." 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                 <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCategoryModal(false)}>Cerrar</button>
                 <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveCategory}>Guardar</button>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .btn-tab {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-tab.active {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          font-weight: 600;
        }
        .btn-tab:hover:not(.active) {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .badge-category {
          background: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }
        .btn-icon-danger {
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-icon-danger:hover {
          background: var(--accent-red);
          color: white;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .modal-content {
          width: 450px;
          padding: 32px;
          border: 1px solid var(--border-color);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .row-hover:hover td {
          background: rgba(255, 255, 255, 0.03) !important;
        }

        /* Corrección Estética de Inputs Premium */
        .form-control {
          background: rgba(15, 23, 42, 0.3) !important;
          color: var(--text-main) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
          font-family: var(--font-family) !important;
          font-size: 0.95rem !important;
          transition: all 0.3s ease !important;
        }
        .form-control:focus {
          background: rgba(15, 23, 42, 0.5) !important;
          border-color: var(--accent-cyan) !important;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1) !important;
          outline: none;
        }
        select.form-control {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 1rem center !important;
          padding-right: 2.5rem !important;
        }
        select.form-control option {
          background: #1e293b;
          color: white;
        }
        input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }
        .batch-container::-webkit-scrollbar {
          width: 8px;
        }
        .batch-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .batch-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .batch-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
};

export default ExpensesModule;
