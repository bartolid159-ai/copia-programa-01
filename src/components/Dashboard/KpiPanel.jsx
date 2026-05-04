const KpiPanel = ({ kpis, loading, viewMode, setViewMode }) => {

  if (loading || !kpis) {
    return (
      <div className="dashboard-grid animate-fade">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="kpi-card glassmorphism skeleton-kpi">
            <div className="skeleton-line" style={{ width: '40%' }}></div>
            <div className="skeleton-line" style={{ width: '80%', height: '2rem' }}></div>
          </div>
        ))}
      </div>
    );
  }

  // Si los datos vienen en el formato antiguo (para compatibilidad o durante la carga), manejamos el fallback
  const currentKpis = kpis[viewMode === 'global' ? 'globales' : 'operativos'] || kpis;
  const { ingresos_totales, egresos_totales, ganancia_neta, margen_neto } = currentKpis;

  return (
    <div className="kpi-panel-wrapper animate-in">
      {/* Toggle Selector */}
      <div className="kpi-toggle-container" style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        marginBottom: '16px',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        width: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          onClick={() => setViewMode('global')}
          className={`toggle-btn ${viewMode === 'global' ? 'active' : ''}`}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            background: viewMode === 'global' ? 'var(--accent-cyan, #06B6D4)' : 'transparent',
            color: viewMode === 'global' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
            boxShadow: viewMode === 'global' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
          }}
        >
          🌍 Global
        </button>
        <button 
          onClick={() => setViewMode('operativo')}
          className={`toggle-btn ${viewMode === 'operativo' ? 'active' : ''}`}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            background: viewMode === 'operativo' ? 'var(--accent-cyan, #06B6D4)' : 'transparent',
            color: viewMode === 'operativo' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
            boxShadow: viewMode === 'operativo' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
          }}
        >
          ⚡ Operativo (Directo)
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-card glassmorphism highlight-card">
          <h3>{viewMode === 'global' ? 'Margen Neto' : 'Margen Bruto (Contribución)'}</h3>
          <div className={`amount ${margen_neto >= 15 ? 'text-green' : margen_neto > 0 ? 'text-cyan' : 'text-red'}`}>
            {margen_neto.toFixed(1)}%
          </div>
          <p className="metric-subtitle">
            {viewMode === 'global' ? 'Rentabilidad final del negocio' : 'Rentabilidad de servicios médicos'}
          </p>
        </div>

        <div className="kpi-card glassmorphism">
          <h3>Ingresos Totales</h3>
          <div className="amount text-green">${ingresos_totales.toFixed(2)}</div>
          <p className="metric-subtitle">Ventas brutas del periodo</p>
        </div>

        <div className="kpi-card glassmorphism">
          <h3>Egresos {viewMode === 'global' ? 'Totales' : 'Operativos'}</h3>
          <div className="amount text-red">${egresos_totales.toFixed(2)}</div>
          <p className="metric-subtitle">
            {viewMode === 'global' ? 'Fijos + Médicos + Inventario' : 'Solo pagos a médicos e insumos'}
          </p>
        </div>

        <div className="kpi-card glassmorphism">
          <h3>{viewMode === 'global' ? 'Resultado Neto' : 'Utilidad Bruta'}</h3>
          <div className={`amount ${ganancia_neta >= 0 ? 'text-cyan' : 'text-red'}`}>
            ${ganancia_neta.toFixed(2)}
          </div>
          <p className="metric-subtitle">
            {viewMode === 'global' ? 'Ganancia después de todo' : 'Ganancia operativa directa'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KpiPanel;
