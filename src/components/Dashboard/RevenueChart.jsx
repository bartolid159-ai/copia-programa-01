const RevenueChart = ({ trendData, loading }) => {
  if (loading || !trendData || trendData.length === 0) {
    return (
      <div className="kpi-card glassmorphism chart-container" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h3 style={{ marginBottom: '20px' }}>Respiración del Negocio</h3>
        <div className="skeleton-line" style={{ width: '80%', height: '100px' }}></div>
        <p className="text-muted" style={{ marginTop: '10px' }}>
          {!trendData || trendData.length === 0 ? 'Sin datos en este rango' : 'Calculando tendencias...'}
        </p>
      </div>
    );
  }

  // Dimensiones del SVG
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Encontrar el valor máximo para escalar
  const maxVal = Math.max(...trendData.map(d => Math.max(d.ingresos_usd, d.egresos_usd)), 1);

  // Generamos el área del path (Spline simulator)
  const getPath = (key, color) => {
    if (trendData.length < 2) return null;
    const points = trendData.map((d, i) => {
      const x = margin.left + (i * innerWidth / (trendData.length - 1 || 1));
      const y = height - margin.bottom - ((d[key] / maxVal) * innerHeight);
      return `${x},${y}`;
    }).join(' ');
    
    return <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />;
  };

  return (
    <div className="kpi-card glassmorphism chart-container animate-in">
      <h3>Respiración del Negocio (Tendencia)</h3>
      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Ejes */}
          <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="var(--border-color)" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="var(--border-color)" />

          {/* Líneas de Tendencia */}
          {getPath('ingresos_usd', '#10B981')}
          {getPath('egresos_usd', '#EF4444')}

          {/* Puntos y Etiquetas */}
          {trendData.map((d, i) => {
            const x = margin.left + (i * innerWidth / (trendData.length - 1 || 1));
            return (
              <g key={d.fecha}>
                <text 
                  x={x} 
                  y={height - 15} 
                  textAnchor="middle" 
                  fontSize="9" 
                  fill="var(--text-muted)"
                >
                  {d.fecha.split('-').slice(1).reverse().join('/')}
                </text>
              </g>
            );
          })}

          {/* Leyenda */}
          <g transform={`translate(${width - 140}, 10)`}>
            <circle cx="5" cy="5" r="4" fill="#10B981" />
            <text x="15" y="9" fontSize="11" fill="var(--text-main)">Ingresos</text>
            <circle cx="5" cy="20" r="4" fill="#EF4444" />
            <text x="15" y="24" fontSize="11" fill="var(--text-main)">Egresos</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RevenueChart;