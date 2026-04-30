import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

vi.mock('./logic/patientService', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
  getPatients: vi.fn().mockResolvedValue([])
}));

vi.mock('./logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([
    { id: 1, nombre: 'Dr. Gregory House', especialidad: 'Diagnóstico' },
    { id: 2, nombre: 'Dra. Allison Cameron', especialidad: 'Inmunología' }
  ])
}));

vi.mock('./logic/reportService', () => ({
  default: {
    getDashboardStats: vi.fn().mockResolvedValue({ kpis: {}, trend: [] }),
    getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
    getFlujoDiario: vi.fn().mockReturnValue([])
  },
  getDashboardStats: vi.fn().mockResolvedValue({ kpis: {}, trend: [] }),
  getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
  getFlujoDiario: vi.fn().mockReturnValue([])
}));

vi.mock('./logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([])
}));

vi.mock('./logic/billingEngine', () => ({
  calculateTotals: vi.fn(() => ({ subtotal_usd: 0, iva_usd: 0, total_usd: 0, total_ves: 0 })),
  calculateCommission: vi.fn(() => 0),
  getRequiredInsumos: vi.fn(() => [])
}));

vi.mock('./logic/backupService', () => ({
  crearBackup: vi.fn().mockResolvedValue(true),
  limpiarBackupsAntiguos: vi.fn().mockResolvedValue(true)
}));

describe('App - Billing Integration', () => {
  it('debe mostrar la vista de facturación al hacer clic en Facturación', async () => {
    render(<App />);
    
    const billingLink = screen.getByText('Facturación');
    await act(async () => {
      fireEvent.click(billingLink);
    });
    
    // Usamos el selector de label para no confundir con los links del sidebar (ej: "Pacientes")
    expect(screen.getByText(/Paciente/i, { selector: 'label' })).toBeDefined();
    expect(screen.getByText(/Tasa de Cambio/i, { selector: 'label' })).toBeDefined();
  });

  it('debe cambiar el título al navegar a facturación', async () => {
    render(<App />);
    
    const billingLink = screen.getByText('Facturación');
    await act(async () => {
      fireEvent.click(billingLink);
    });
    
    const headers = screen.getAllByText('Facturación');
    expect(headers.length).toBe(2);
  });
});
