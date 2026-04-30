import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import App from '../../src/App.jsx';

// Mocking required logic
vi.mock('../../src/logic/reportService', () => ({
  default: {
    getDashboardStats: vi.fn().mockResolvedValue({ kpis: {}, trend: [] }),
    getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
    getFlujoDiario: vi.fn().mockReturnValue([])
  },
  getDashboardStats: vi.fn().mockResolvedValue({ kpis: {}, trend: [] }),
  getKpiDia: vi.fn().mockReturnValue({ ingresos: { usd: 0, ves: 0 }, egresos: { usd: 0, ves: 0 }, ganancia_neta: { usd: 0, ves: 0 } }),
  getFlujoDiario: vi.fn().mockReturnValue([])
}));

vi.mock('../../src/logic/doctorService', () => ({
  getDoctors: vi.fn().mockResolvedValue([])
}));

vi.mock('../../src/logic/serviceLogic', () => ({
  getServices: vi.fn().mockResolvedValue([])
}));

describe('App Component - Tarea 01', () => {
  afterEach(cleanup);

  it('debe renderizar el título de la aplicación y permitir navegar a Contabilidad', async () => {
    render(<App />);
    expect(screen.getByText(/Médica/i)).toBeInTheDocument();
    
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
