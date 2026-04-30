import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../../src/components/Dashboard/Dashboard';
import DashboardFilters from '../../src/components/Dashboard/DashboardFilters';

// Mocking the logic services
vi.mock('../../src/logic/reportService', () => ({
  default: {
    getDashboardStats: vi.fn().mockResolvedValue({
      kpis: {
        ingresos_totales: 1000,
        egresos_totales: 400,
        ganancia_neta: 600,
        margen_neto: 60,
        is_margen_contribucion: false
      },
      trend: []
    })
  },
  getDashboardStats: vi.fn().mockResolvedValue({
    kpis: {
      ingresos_totales: 1000,
      egresos_totales: 400,
      ganancia_neta: 600,
      margen_neto: 60,
      is_margen_contribucion: false
    },
    trend: []
  })
}));

vi.mock('../../src/logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([{ id: 1, nombre: 'Dr. House' }])
}));

vi.mock('../../src/logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([{ id: 1, nombre: 'Consulta' }])
}));

describe('Dashboard Component - New Business Flow', () => {
  describe('Dashboard Main Component', () => {
    it('debe renderizar el título del dashboard actualizado', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Flujo de Negocio Inteligente')).toBeDefined();
      });
    });

    it('debe mostrar el subtítulo del dashboard actualizado', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Control de rentabilidad y métricas operativas/i)).toBeDefined();
      });
    });

    it('debe mostrar las métricas principales con los nuevos labels', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Ingresos Totales')).toBeDefined();
        expect(screen.getByText('Egresos Totales')).toBeDefined();
        expect(screen.getByText('Margen de Ganancia')).toBeDefined();
      });
    });
  });

  describe('DashboardFilters Component - New Design', () => {
    const defaultFilters = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      medicos: [],
      servicios: []
    };

    it('debe renderizar los filtros de fecha Desde/Hasta', () => {
      render(
        <DashboardFilters
          filters={defaultFilters}
          onFilterChange={() => {}}
        />
      );
      
      expect(screen.getByText('Desde')).toBeDefined();
      expect(screen.getByText('Hasta')).toBeDefined();
    });

    it('debe renderizar selectores de Médicos y Servicios', () => {
      render(
        <DashboardFilters
          filters={defaultFilters}
          onFilterChange={() => {}}
        />
      );
      
      expect(screen.getByText('Médicos')).toBeDefined();
      expect(screen.getByText('Servicios')).toBeDefined();
    });

    it('debe tener botón de Limpiar', () => {
      render(
        <DashboardFilters
          filters={defaultFilters}
          onFilterChange={() => {}}
        />
      );
      
      expect(screen.getByText('Limpiar')).toBeDefined();
    });

    it('debe llamar a onFilterChange al cambiar fecha', () => {
      const mockFilterChange = vi.fn();
      render(
        <DashboardFilters
          filters={defaultFilters}
          onFilterChange={mockFilterChange}
        />
      );
      
      const inputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(inputs[0], { target: { value: '2024-02-01' } });
      
      expect(mockFilterChange).toHaveBeenCalledWith('startDate', '2024-02-01');
    });
  });
});