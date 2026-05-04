const RevenueChart = ({ trendData, loading, viewMode = 'global' }) => {
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

  const egresosKey = viewMode === 'global' ? 'egresos_usd_global' : 'egresos_usd_operativo';

  // Dimensiones del SVG
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Encontrar el valor máximo para escalar
  const maxVal = Math.max(...trendData.map(d => Math.max(d.ingresos_usd, d[egresosKey] || d.egresos_usd)), 1);

  // Generamos el área del path (Cubic Bezier Spline)
  const getPathData = (key) => {
    if (trendData.length < 2) return "";
    
    const points = trendData.map((d, i) => ({
      x: margin.left + (i * innerWidth / (trendData.length - 1 || 1)),
      y: height - margin.bottom - ((d[key] / maxVal) * innerHeight)
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const getAreaData = (key) => {
    const path = getPathData(key);
    if (!path) return "";
    const lastPointX = margin.left + innerWidth;
    const firstPointX = margin.left;
    const baseY = height - margin.bottom;
    return `${path} L ${lastPointX} ${baseY} L ${firstPointX} ${baseY} Z`;
  };

  return (
    <div className="kpi-card glassmorphism chart-container animate-in">
      <h3>Respiración del Negocio {viewMode === 'global' ? '(Flujo Total)' : '(Operativo)'}</h3>
      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="grad-ingresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-egresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ejes */}
          <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="var(--border-color)" strokeWidth="1" />
          
          {/* Áreas */}
          <path d={getAreaData('ingresos_usd')} fill="url(#grad-ingresos)" />
          <path d={getAreaData(egresosKey)} fill="url(#grad-egresos)" />

          {/* Líneas de Tendencia */}
          <path d={getPathData('ingresos_usd')} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />
          <path d={getPathData(egresosKey)} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />

          {/* Etiquetas X */}
          {trendData.map((d, i) => {
            const x = margin.left + (i * innerWidth / (trendData.length - 1 || 1));
            return (
              <g key={d.fecha}>
                <circle cx={x} cy={height - margin.bottom} r="2" fill="var(--border-color)" />
                <text 
                  x={x} 
                  y={height - 15} 
                  textAnchor="middle" 
                  fontSize="9" 
                  fill="var(--text-muted)"
                  transform={`rotate(-20, ${x}, ${height - 15})`}
                >
                  {d.fecha.split('-').slice(1).reverse().join('/')}
                </text>
              </g>
            );
          })}

          {/* Leyenda */}
          <g transform={`translate(${width - 140}, 10)`}>
            <rect x="0" y="0" width="130" height="40" rx="8" fill="rgba(0,0,0,0.2)" />
            <circle cx="15" cy="15" r="4" fill="#10B981" />
            <text x="25" y="19" fontSize="11" fill="var(--text-main)" fontWeight="bold">Ingresos</text>
            <circle cx="15" cy="30" r="4" fill="#EF4444" />
            <text x="25" y="34" fontSize="11" fill="var(--text-main)" fontWeight="bold">Egresos</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RevenueChart;