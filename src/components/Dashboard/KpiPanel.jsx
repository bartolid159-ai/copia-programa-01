const KpiPanel = ({ kpis, loading }) => {
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

  const { ingresos_totales, egresos_totales, ganancia_neta, margen_neto, is_margen_contribucion } = kpis;

  return (
    <div className="dashboard-grid animate-in">
      <div className="kpi-card glassmorphism highlight-card">
        <h3>{is_margen_contribucion ? 'Margen de Contribución' : 'Margen de Ganancia'}</h3>
        <div className={`amount ${margen_neto >= 15 ? 'text-green' : margen_neto > 0 ? 'text-cyan' : 'text-red'}`}>
          {margen_neto.toFixed(1)}%
        </div>
        <p className="metric-subtitle">Rentabilidad sobre ingresos</p>
      </div>

      <div className="kpi-card glassmorphism">
        <h3>Ingresos Totales</h3>
        <div className="amount text-green">${ingresos_totales.toFixed(2)}</div>
        <p className="metric-subtitle">Flujo bruto de entrada</p>
      </div>

      <div className="kpi-card glassmorphism">
        <h3>Egresos Totales</h3>
        <div className="amount text-red">${egresos_totales.toFixed(2)}</div>
        <p className="metric-subtitle">{is_margen_contribucion ? 'Solo costos directos' : 'Operativos + Directos'}</p>
      </div>

      <div className="kpi-card glassmorphism">
        <h3>Resultado Neto</h3>
        <div className={`amount ${ganancia_neta >= 0 ? 'text-cyan' : 'text-red'}`}>
          ${ganancia_neta.toFixed(2)}
        </div>
        <p className="metric-subtitle">Balance del periodo</p>
      </div>
    </div>
  );
};

export default KpiPanel;
