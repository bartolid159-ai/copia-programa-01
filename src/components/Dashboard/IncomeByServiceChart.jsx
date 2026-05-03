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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {data.map((item, index) => {
            const barWidth = (item.ingresos_usd / maxValue) * 100;
            const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
            const color = colors[index % colors.length];
            
            return (
              <div key={item.nombre} className="chart-row">
                <div className="label-container">
                  <span className="row-label">{item.nombre}</span>
                  <span className="row-value">${item.ingresos_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${barWidth}%`, 
                      background: `linear-gradient(90deg, ${color}20, ${color})`,
                      boxShadow: `0 0 15px ${color}30`,
                      border: `1px solid ${color}50`
                    }}
                  >
                    <div className="bar-glow"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        .chart-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .label-container {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main);
        }
        .row-value {
          font-weight: 700;
        }
        .bar-track {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          border-radius: 6px;
          position: relative;
          transition: width 1s ease-out;
        }
        .bar-glow {
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default IncomeByServiceChart;