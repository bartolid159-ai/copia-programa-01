import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serviceLogic from '../../src/logic/serviceLogic';
import * as dbManager from '../../src/db/manager';

// Mock del manager
vi.mock('../../src/db/manager', () => ({
  getDb: vi.fn(),
  executeTransaction: vi.fn((cb) => cb()),
  getAllServicios: vi.fn(),
  getActiveJornada: vi.fn(),
  getServiciosPorJornada: vi.fn(),
  getInsumosByServicio: vi.fn(() => []),
  isBrowser: false
}));

describe('Lógica de Jornadas Médicas - Precios Dinámicos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceLogic.setBrowserMode(false); // Forzar modo Node para usar mocks del manager
  });

  it('debe devolver el precio base si no hay jornada activa', async () => {
    dbManager.getAllServicios.mockReturnValue([
      { id: 1, nombre: 'Consulta', precio_usd: 50 }
    ]);
    dbManager.getActiveJornada.mockReturnValue(null);

    const services = await serviceLogic.getServices();
    expect(services[0].precio_usd).toBe(50);
    expect(services[0].es_promocion).toBeUndefined();
  });

  it('debe aplicar el precio de oferta si hay una jornada activa', async () => {
    dbManager.getAllServicios.mockReturnValue([
      { id: 1, nombre: 'Consulta', precio_usd: 50 }
    ]);
    dbManager.getActiveJornada.mockReturnValue({ id: 10, nombre: 'Promo' });
    dbManager.getServiciosPorJornada.mockReturnValue([
      { id_servicio: 1, precio_oferta_usd: 30 }
    ]);

    const services = await serviceLogic.getServices();
    expect(services[0].precio_usd).toBe(30);
    expect(services[0].es_promocion).toBe(true);
  });

  it('no debe afectar a servicios que no están en la jornada', async () => {
    dbManager.getAllServicios.mockReturnValue([
      { id: 1, nombre: 'Consulta', precio_usd: 50 },
      { id: 2, nombre: 'Eco', precio_usd: 100 }
    ]);
    dbManager.getActiveJornada.mockReturnValue({ id: 10 });
    dbManager.getServiciosPorJornada.mockReturnValue([
      { id_servicio: 1, precio_oferta_usd: 30 }
    ]);

    const services = await serviceLogic.getServices();
    expect(services.find(s => s.id === 1).precio_usd).toBe(30);
    expect(services.find(s => s.id === 2).precio_usd).toBe(100);
  });
});
