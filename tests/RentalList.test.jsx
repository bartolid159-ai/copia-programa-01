import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RentalList from '../src/components/Rentals/RentalList';
import * as alquilerService from '../src/logic/alquilerService';
import * as auth from '../src/auth';

// Mock de servicios
vi.mock('../src/logic/alquilerService', () => ({
  getAlquileres: vi.fn(),
  eliminarAlquiler: vi.fn()
}));

vi.mock('../src/auth', () => ({
  login: vi.fn()
}));

describe('RentalList Component - Security Deletion', () => {
  const mockOnShowBanner = vi.fn();
  const mockRentals = [
    { id: 1, fecha: '2026-05-01', consultorio: 'C1', turno: 'MAÑANA', nombre_arrendatario: 'Dr. Test', precio_usd: 50, metodo_pago: 'EFECTIVO' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    alquilerService.getAlquileres.mockResolvedValue(mockRentals);
  });

  it('debe mostrar el SecurityModal al intentar eliminar un registro', async () => {
    await act(async () => {
      render(<RentalList onShowBanner={mockOnShowBanner} />);
    });

    const deleteBtn = screen.getByTitle('Eliminar Alquiler');
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(screen.getByText('Confirmar Borrado de Alquiler')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
  });

  it('debe mostrar error si la contraseña es incorrecta', async () => {
    auth.login.mockResolvedValue({ success: false });

    await act(async () => {
      render(<RentalList onShowBanner={mockOnShowBanner} />);
    });

    // Abrir modal
    fireEvent.click(screen.getByTitle('Eliminar Alquiler'));

    // Intentar confirmar
    const input = screen.getByPlaceholderText('••••••••');
    fireEvent.change(input, { target: { value: 'wrong-pass' } });
    
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Confirmar Acción/i }));
    });

    expect(screen.getByText('Clave incorrecta. Acceso denegado.')).toBeDefined();
    expect(alquilerService.eliminarAlquiler).not.toHaveBeenCalled();
  });

  it('debe eliminar el registro si la contraseña es correcta', async () => {
    auth.login.mockResolvedValue({ success: true });
    alquilerService.eliminarAlquiler.mockResolvedValue({ success: true, message: 'Eliminado' });

    await act(async () => {
      render(<RentalList onShowBanner={mockOnShowBanner} />);
    });

    fireEvent.click(screen.getByTitle('Eliminar Alquiler'));
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'correct-pass' } });
    
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Confirmar Acción/i }));
    });

    expect(alquilerService.eliminarAlquiler).toHaveBeenCalledWith(1);
    expect(mockOnShowBanner).toHaveBeenCalledWith('Eliminado');
  });
});
