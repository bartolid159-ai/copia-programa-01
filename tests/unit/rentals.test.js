/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as alquilerService from '../../src/logic/alquilerService';
import * as dbManager from '../../src/db/manager.js';

vi.mock('../../src/db/manager.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    insertAlquilerConsultorio: vi.fn(),
    getAllAlquileres: vi.fn(),
    deleteAlquiler: vi.fn(),
  };
});

describe('RentalService - Business Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRental = {
    nombre_arrendatario: 'Dr. Smith',
    consultorio: 'Consultorio 1',
    fecha: '2026-05-01',
    turno: 'MAÑANA',
    precio_usd: 20,
    metodo_pago: 'EFECTIVO_USD'
  };

  it('should register a rental successfully', async () => {
    vi.mocked(dbManager.insertAlquilerConsultorio).mockReturnValue({ lastInsertRowid: 1 });
    
    const result = await alquilerService.registrarAlquiler(validRental);

    expect(result.success).toBe(true);
    expect(result.id).toBe(1);
    expect(dbManager.insertAlquilerConsultorio).toHaveBeenCalledWith({
      ...validRental,
      precio_usd: 20
    });
  });

  it('should return error if mandatory fields are missing', async () => {
    const result = await alquilerService.registrarAlquiler({
      nombre_arrendatario: 'Dr. Smith'
      // Missing other fields
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('obligatorios');
    expect(dbManager.insertAlquilerConsultorio).not.toHaveBeenCalled();
  });

  it('should get all rentals', async () => {
    const mockRentals = [validRental];
    vi.mocked(dbManager.getAllAlquileres).mockReturnValue(mockRentals);

    const results = await alquilerService.getAlquileres();

    expect(results).toHaveLength(1);
    expect(dbManager.getAllAlquileres).toHaveBeenCalled();
  });

  it('should delete a rental', async () => {
    const result = await alquilerService.eliminarAlquiler(1);

    expect(result.success).toBe(true);
    expect(dbManager.deleteAlquiler).toHaveBeenCalledWith(1);
  });
});
