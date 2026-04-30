import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as manager from '../../src/db/manager';
import * as patientService from '../../src/logic/patientService';

// Mock del manager para evitar dependencias nativas en el test
vi.mock('../../src/db/manager', () => ({
  getDb: vi.fn(),
  executeTransaction: vi.fn((cb) => cb()),
  deletePaciente: vi.fn((id) => ({ success: true, message: 'Deleted' })),
  isBrowser: false
}));

describe('Servicio de Pacientes - Borrado Seguro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe llamar a deletePaciente del manager cuando no es modo navegador', async () => {
    const result = await patientService.deletePatient(123);
    
    expect(manager.deletePaciente).toHaveBeenCalledWith(123);
    expect(result.success).toBe(true);
  });

  it('debe manejar errores en el borrado', async () => {
    manager.deletePaciente.mockImplementationOnce(() => {
      throw new Error('Database Error');
    });

    const result = await patientService.deletePatient(123);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Error al borrar');
  });
});
