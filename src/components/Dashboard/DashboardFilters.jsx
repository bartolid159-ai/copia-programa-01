import React, { useState, useEffect } from 'react';
import { getDoctors } from '../../logic/doctorService';
import { getServices } from '../../logic/serviceLogic';

function DashboardFilters({ filters, onFilterChange }) {
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  // Estados locales para los selectores de Mes/Año
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await getDoctors();
        const s = await getServices();
        setAvailableDoctors(d || []);
        setAvailableServices(s || []);
      } catch (error) {
        console.error("Error loading filter data:", error);
      }
    };
    fetchData();
  }, []);

  const updateDateRange = (month, year) => {
    if (!month) {
      // Si no hay mes, filtramos todo el año
      onFilterChange('startDate', `${year}-01-01`);
      onFilterChange('endDate', `${year}-12-31`);
    } else {
      // Filtramos el mes específico
      const start = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const end = `${year}-${month}-${lastDay}`;
      onFilterChange('startDate', start);
      onFilterChange('endDate', end);
    }
  };

  const handleMonthChange = (e) => {
    const m = e.target.value;
    setSelectedMonth(m);
    updateDateRange(m, selectedYear);
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setSelectedYear(y);
    updateDateRange(selectedMonth, y);
  };

  const handleMultiChange = (type, value) => {
    const current = filters[type] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange(type, updated);
  };

  const getSelectedLabels = (type, items) => {
    const selectedIds = filters[type] || [];
    if (selectedIds.length === 0) return 'Todos';
    if (selectedIds.length === 1) {
      const item = items.find(i => i.id === selectedIds[0]);
      return item ? item.nombre : '1 seleccionado';
    }
    return `${selectedIds.length} seleccionados`;
  };

  return (
    <div className="dashboard-filters animate-in">
      {/* Selector Rápido de Período */}
      <div className="filter-group">
        <label className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 12h20M12 2l4 4-4 4M12 22l-4-4 4-4" />
          </svg>
          Mes
        </label>
        <select 
          className="filter-input"
          value={selectedMonth}
          onChange={handleMonthChange}
          style={{ cursor: 'pointer' }}
        >
          <option value="">Todo el año</option>
          {meses.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Año</label>
        <select 
          className="filter-input"
          value={selectedYear}
          onChange={handleYearChange}
          style={{ cursor: 'pointer' }}
        >
          {años.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Filtro de Fecha (Calendario Manual) */}
      <div className="filter-group">
        <label className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Desde
        </label>
        <input 
          type="date" 
          className="filter-input"
          value={filters.startDate}
          onChange={(e) => {
            onFilterChange('startDate', e.target.value);
            setSelectedMonth(''); // Reset mes si se toca manual
          }}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Hasta</label>
        <input 
          type="date" 
          className="filter-input"
          value={filters.endDate}
          onChange={(e) => {
            onFilterChange('endDate', e.target.value);
            setSelectedMonth(''); // Reset mes si se toca manual
          }}
        />
      </div>

      {/* Filtro de Médicos (Multi-Select Custom) */}
      <div className="filter-group dropdown-filter">
        <label className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Médicos
        </label>
        <div className="custom-select" onClick={() => setIsDoctorOpen(!isDoctorOpen)}>
          <span className="select-text">{getSelectedLabels('medicos', availableDoctors)}</span>
          <svg className={`chevron ${isDoctorOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isDoctorOpen && (
          <div className="select-dropdown glassmorphism">
            {availableDoctors.map(doc => (
              <label key={doc.id} className="select-option">
                <input 
                  type="checkbox" 
                  checked={(filters.medicos || []).includes(doc.id)} 
                  onChange={() => handleMultiChange('medicos', doc.id)}
                />
                {doc.nombre}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Filtro de Servicios (Multi-Select Custom) */}
      <div className="filter-group dropdown-filter">
        <label className="filter-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          Servicios
        </label>
        <div className="custom-select" onClick={() => setIsServiceOpen(!isServiceOpen)}>
          <span className="select-text">{getSelectedLabels('servicios', availableServices)}</span>
          <svg className={`chevron ${isServiceOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isServiceOpen && (
          <div className="select-dropdown glassmorphism">
            {availableServices.map(srv => (
              <label key={srv.id} className="select-option">
                <input 
                  type="checkbox" 
                  checked={(filters.servicios || []).includes(srv.id)} 
                  onChange={() => handleMultiChange('servicios', srv.id)}
                />
                {srv.nombre}
              </label>
            ))}
          </div>
        )}
      </div>

      <button 
        className="filter-reset"
        onClick={() => {
          onFilterChange('startDate', '');
          onFilterChange('endDate', '');
          onFilterChange('medicos', []);
          onFilterChange('servicios', []);
          setSelectedMonth('');
          setSelectedYear(new Date().getFullYear().toString());
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        Limpiar
      </button>
    </div>
  );
}

export default DashboardFilters;