import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import App from '../../src/App.jsx';

// Mocking manager.js DIRECTLY is the most robust way to prevent ERR_DLOPEN_FAILED
// by ensuring better-sqlite3 is NEVER even required during these UI tests.
vi.mock('../../src/db/manager.js', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      run: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
      get: vi.fn().mockReturnValue(null),
      all: vi.fn().mockReturnValue([]),
    }),
    exec: vi.fn(),
    pragma: vi.fn(),
    transaction: vi.fn((cb) => cb),
    close: vi.fn(),
  };

  return {
    getDb: vi.fn().mockReturnValue(mockDb),
    closeDb: vi.fn(),
    executeTransaction: vi.fn((cb) => cb(mockDb)),
    insertCategoria: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
    getAllCategorias: vi.fn().mockReturnValue([]),
    insertInsumo: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
    getAllInsumos: vi.fn().mockReturnValue([]),
    getInsumoById: vi.fn().mockReturnValue(null),
    searchInsumos: vi.fn().mockReturnValue([]),
    getInsumosConStockBajo: vi.fn().mockReturnValue([]),
    getAllPatients: vi.fn().mockReturnValue([]),
    getAllDoctors: vi.fn().mockReturnValue([]),
    getAllServices: vi.fn().mockReturnValue([]),
    getDashboardStats: vi.fn().mockResolvedValue({ 
      kpis: { ingresos_totales: 0, egresos_totales: 0, ganancia_neta: 0, margen_neto: 0, is_margen_contribucion: false }, 
      trend: [] 
    }),
    getKpiDia: vi.fn().mockReturnValue({ 
      ingresos: { usd: 0, ves: 0 }, 
      egresos: { usd: 0, ves: 0 }, 
      ganancia_neta: { usd: 0, ves: 0 } 
    }),
    getFlujoDiario: vi.fn().mockReturnValue([]),
    getPendingLiquidationsCount: vi.fn().mockReturnValue(0),
    getGastoTemplates: vi.fn().mockResolvedValue([]),
    insertGastoTemplate: vi.fn().mockResolvedValue({ lastInsertRowid: 1 }),
    deleteGastoTemplate: vi.fn().mockResolvedValue({ success: true }),
    insertAsientoManual: vi.fn().mockResolvedValue({ success: true })
  };
});

// Also mock services to avoid any top-level execution logic
vi.mock('../../src/logic/reportService', () => ({
  default: {
    getDashboardStats: vi.fn().mockResolvedValue({ 
      kpis: { ingresos_totales: 0, egresos_totales: 0, ganancia_neta: 0, margen_neto: 0, is_margen_contribucion: false }, 
      trend: [] 
    }),
    getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
    getFlujoDiario: vi.fn().mockReturnValue([]),
    getIngresosPorServicio: vi.fn().mockResolvedValue([]),
    getIngresosPorMedico: vi.fn().mockResolvedValue([])
  },
  getDashboardStats: vi.fn().mockResolvedValue({ 
    kpis: { ingresos_totales: 0, egresos_totales: 0, ganancia_neta: 0, margen_neto: 0, is_margen_contribucion: false }, 
    trend: [] 
  }),
  getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
  getFlujoDiario: vi.fn().mockReturnValue([]),
  getIngresosPorServicio: vi.fn().mockResolvedValue([]),
  getIngresosPorMedico: vi.fn().mockResolvedValue([])
}));

vi.mock('../../src/logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([])
}));

vi.mock('../../src/logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([])
}));

vi.mock('../../src/logic/patientService', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
  getPatients: vi.fn().mockResolvedValue([])
}));

vi.mock('../../src/logic/backupService', () => ({
  crearBackup: vi.fn().mockResolvedValue(true),
  limpiarBackupsAntiguos: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../src/logic/insumoLogic', () => ({
  getInsumos: vi.fn().mockResolvedValue([]),
  getCategorias: vi.fn().mockResolvedValue([]),
  getInsumosConStockBajo: vi.fn().mockResolvedValue([])
}));

describe('App Component - Tarea 01', () => {
  afterEach(cleanup);

  it('debe renderizar el título de la aplicación y permitir navegar a Contabilidad', async () => {
    render(<App />);
    expect(screen.getByText(/imagen y salud/i)).toBeInTheDocument();
    
    // Al inicio debe cargar Pacientes (nuevo comportamiento)
    expect(screen.getByText(/Gestión de Pacientes/i)).toBeInTheDocument();

    // Buscamos y hacemos click en el módulo de Contabilidad en el sidebar
    const accountingSidebarLink = screen.getByText('Contabilidad');
    fireEvent.click(accountingSidebarLink);

    // Ahora verificamos que el header y el contenido cambien
    expect(screen.getByText(/Contabilidad \/ Dashboard/i)).toBeInTheDocument();
    
    await waitFor(() => {
        expect(screen.getByText(/Flujo de Negocio Inteligente/i)).toBeInTheDocument();
    });
  });

  it('debe iniciar en Modo Oscuro por defecto (sin la clase light-mode)', () => {
    render(<App />);
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });

  it('debe cambiar a Modo Claro al hacer click en el botón de toggle', () => {
    render(<App />);
    const toggleButton = screen.getByRole('button', { name: /Modo Claro/i });
    
    // Cambiar a Modo Claro
    fireEvent.click(toggleButton);
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(screen.getByText(/🌙 Modo Oscuro/i)).toBeInTheDocument();

    // Regresar a Modo Oscuro
    fireEvent.click(screen.getByRole('button', { name: /Modo Oscuro/i }));
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });
});
