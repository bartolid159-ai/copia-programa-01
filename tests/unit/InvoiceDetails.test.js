/** @vitest-environment node */
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getDb, 
  closeDb, 
  getFacturaById,
  getFacturaDetalles,
  insertServicio,
  processInvoice
} from '../../src/db/manager.js';

describe('Factura Details and Printing', () => {
  beforeEach(() => {
    closeDb();
    getDb(':memory:');
    
    // Setup data
    getDb().prepare("INSERT INTO pacientes (id, nombre, cedula_rif, telefono) VALUES (1, 'Juan Perez', '123456', '0414')").run();
    getDb().prepare("INSERT INTO medicos (id, nombre, especialidad) VALUES (1, 'Dr. House', 'General')").run();
    
    insertServicio({ 
      nombre: 'Consulta General', 
      precio_usd: 50, 
      es_exento: 1, 
      id_medico_defecto: null 
    });
  });

  it('should retrieve a factura by ID', () => {
    const facturaData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 40,
      metodo_pago: 'EFECTIVO',
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 50, es_exento: 1 }
      ],
      totals: {
        subtotal_usd: 50,
        total_usd: 50,
        total_ves: 2000
      },
      commission: 5,
      requiredInsumos: []
    };

    const result = processInvoice(facturaData);
    const facturaId = result.facturaId;
    const factura = getFacturaById(facturaId);

    expect(factura).toBeDefined();
    expect(factura.id).toBe(facturaId);
    expect(factura.total_usd).toBe(50);
  });

  it('should get service details for a factura', () => {
    const facturaData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 40,
      metodo_pago: 'PAGO_MOVIL',
      items: [
        { id_servicio: 1, cantidad: 2, precio_usd: 50, es_exento: 1 }
      ],
      totals: {
        subtotal_usd: 100,
        total_usd: 100,
        total_ves: 4000
      },
      commission: 10,
      requiredInsumos: []
    };

    const result = processInvoice(facturaData);
    const facturaId = result.facturaId;
    const detalles = getFacturaDetalles(facturaId);

    expect(detalles).toHaveLength(1);
    expect(detalles[0].id_servicio).toBe(1);
    expect(detalles[0].cantidad).toBe(2);
    expect(detalles[0].servicio_nombre).toBe('Consulta General');
  });
});
