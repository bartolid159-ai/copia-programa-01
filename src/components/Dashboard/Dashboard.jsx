import { useState, useEffect } from 'react';
import KpiPanel from './KpiPanel';
import StockAlertWidget from './StockAlertWidget';
import RevenueChart from './RevenueChart';
import TopServicesWidget from './TopServicesWidget';
import RateHistoryWidget from './RateHistoryWidget';
import DashboardFilters from './DashboardFilters';
import { getDashboardStats } from '../../logic/reportService';

function Dashboard() {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    medicos: [],
    servicios: []
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getDashboardStats(filters);
        setStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [filters]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Flujo de Negocio Inteligente</h1>
          <p className="dashboard-subtitle">Control de rentabilidad y métricas operativas (Real-Time)</p>
        </div>
      </header>

      {/* Filtros Granulares */}
      <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* 1. KPIs Principales */}
      <KpiPanel kpis={stats?.kpis} loading={loading} />

      <div className="dashboard-layout" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Fila 1: Gráfica y Alertas Stock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          <RevenueChart trendData={stats?.trend} loading={loading} />
          <StockAlertWidget />
        </div>

        {/* Fila 2: Pareto Real y Auditoría de Tasas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          <TopServicesWidget />
          <RateHistoryWidget />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;