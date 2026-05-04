import { useState, useEffect } from 'react';
import KpiPanel from './KpiPanel';
import StockAlertWidget from './StockAlertWidget';
import RevenueChart from './RevenueChart';
import TopServicesWidget from './TopServicesWidget';
import RateHistoryWidget from './RateHistoryWidget';
import DashboardFilters from './DashboardFilters';
import ExpensesModule from './ExpensesModule';
import IncomeByServiceChart from './IncomeByServiceChart';
import IncomeByDoctorChart from './IncomeByDoctorChart';
import { getDashboardStats } from '../../logic/reportService';

function Dashboard() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    startDate: firstDayOfMonth,
    endDate: todayStr,
    medicos: [],
    servicios: []
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('global'); // 'global' o 'operativo'

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
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="dashboard-title">
          <h1>{activeTab === 'dashboard' ? 'Flujo de Negocio Inteligente' : 'Gestión de Gastos'}</h1>
          <p className="dashboard-subtitle">
            {activeTab === 'dashboard' 
              ? 'Control de rentabilidad y métricas operativas (Real-Time)' 
              : 'Registro y plantillas de egresos de la clínica'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            📊 Tablero
          </button>
          <button 
            className={activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => setActiveTab('expenses')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            💸 Gestionar Gastos
          </button>
        </div>
      </header>

      {activeTab === 'dashboard' ? (
        <>
          {/* Filtros Granulares */}
          <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* 1. KPIs Principales */}
          <KpiPanel kpis={stats?.kpis} loading={loading} viewMode={viewMode} setViewMode={setViewMode} />

          <div className="dashboard-layout" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Fila 1: Gráfica y Alertas Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              <RevenueChart trendData={stats?.trend} loading={loading} viewMode={viewMode} />
              <StockAlertWidget />
            </div>

            {/* Fila 2: Pareto Real y Auditoría de Tasas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              <TopServicesWidget />
              <RateHistoryWidget />
            </div>

            {/* Fila 3: Gráficos de Ingresos por Servicio y Médico */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              <IncomeByServiceChart startDate={filters.startDate} endDate={filters.endDate} />
              <IncomeByDoctorChart startDate={filters.startDate} endDate={filters.endDate} />
            </div>

          </div>
        </>
      ) : (
        <div style={{ marginTop: '24px' }}>
          <ExpensesModule onShowBanner={filters.onShowBanner || (() => {})} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;