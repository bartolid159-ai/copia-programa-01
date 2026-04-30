import { useEffect, useState } from 'react';
import * as reportService from '../../logic/reportService';

const IncomeByServiceChart = ({ startDate = null, endDate = null }) => {
  const [data, setData] = useState([]);
  const [maxValue, setMaxValue] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      const result = await reportService.getIngresosPorServicio(startDate, endDate);
      setData(result);
      const max = Math.max(...result.map(d => d.ingresos_usd), 1);
      setMaxValue(max);
    };
    loadData();
  }, [startDate, endDate]);

  return (
    <div className="container-card glassmorphism animate-in" style={{ padding: '20px' }}>
      <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>📊</span>
        Ingresos por Servicio
      </h4>
      <p className="subtitle" style={{ marginTop: '-10px', marginBottom: '15px' }}>
        Distribución de ingresos generados por cada servicio
      </p>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
          No hay datos de servicios en el período seleccionado
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.map((item, index) => {
            const barWidth = (item.ingresos_usd / maxValue) * 100;
            const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
            const color = colors[index % colors.length];
            
            return (
              <div key={item.nombre} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '120px', fontSize: '0.85rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.nombre}
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '28px', position: 'relative', overflow: 'hidden' }}>
                  <div 
                    className="animate-in" 
                    style={{ 
                      width: `${barWidth}%`, 
                      height: '100%', 
                      background: `linear-gradient(90deg, ${color}40, ${color})`,
                      borderRadius: '6px',
                      transition: 'width 0.6s ease-out',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '10px'
                    }}
                  >
                    {barWidth > 15 && (
                      <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: '600' }}>
                        ${item.ingresos_usd.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {barWidth <= 15 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    ${item.ingresos_usd.toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncomeByServiceChart;