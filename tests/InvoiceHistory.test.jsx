import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InvoiceHistory from '../src/components/Billing/InvoiceHistory';
import * as manager from '../src/db/manager';

// Mock del manager
vi.mock('../src/db/manager', () => ({
  getHistorialFacturas: vi.fn(),
  getFacturaById: vi.fn(),
  getFacturaDetalles: vi.fn(),
  searchFacturas: vi.fn(),
  getAllFacturas: vi.fn()
}));

describe('InvoiceHistory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    manager.getHistorialFacturas.mockResolvedValue([
      { id: 1, fecha: '2026-05-01', paciente_nombre: 'Juan Perez', total_usd: 100, total_ves: 3600, metodo_pago: 'EFECTIVO_USD' }
    ]);
  });

  it('debe renderizar los inputs de rango de fechas', async () => {
    await act(async () => {
      render(<InvoiceHistory />);
    });
    
    expect(screen.getByText('Desde:')).toBeDefined();
    expect(screen.getByText('Hasta:')).toBeDefined();
  });

  it('debe llamar a getHistorialFacturas cuando cambian las fechas', async () => {
    await act(async () => {
      render(<InvoiceHistory />);
    });

    const inputStart = document.querySelector('input[type="date"]:first-of-type');
    
    await act(async () => {
      fireEvent.change(inputStart, { target: { value: '2026-05-01' } });
    });

    expect(manager.getHistorialFacturas).toHaveBeenCalled();
    const callArgs = manager.getHistorialFacturas.mock.calls[manager.getHistorialFacturas.mock.calls.length - 1][0];
    expect(callArgs.startDate).toBe('2026-05-01');
  });

  it('debe calcular el IVA dinámicamente en el modal de detalles', async () => {
    const mockFactura = { id: 1, total_usd: 100, fecha: '2026-05-01' };
    const mockDetalles = [
      { servicio_nombre: 'Consulta', cantidad: 1, precio_unitario_usd: 100, iva_porcentaje: 0 }
    ];
    
    manager.getFacturaById.mockResolvedValue(mockFactura);
    manager.getFacturaDetalles.mockResolvedValue(mockDetalles);

    await act(async () => {
      render(<InvoiceHistory />);
    });

    const viewBtn = screen.getByText('📄');
    await act(async () => {
      fireEvent.click(viewBtn);
    });

    // En el modal, el IVA debería ser 0%
    expect(screen.getByText('IVA (0%):')).toBeDefined();
    expect(screen.getByText('$0.00')).toBeDefined();
  });
});
