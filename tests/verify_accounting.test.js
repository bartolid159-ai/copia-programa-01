
import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, closeDb, insertPaciente, insertMedico, insertServicio, insertInsumo, setServicioInsumos, registrarCompra, processInvoice, registrarTasa } from '../src/db/manager.js';
import { getDashboardStats } from '../src/logic/reportService.js';

describe('Verification of Accounting KPIs', () => {
  beforeEach(() => {
    closeDb();
    getDb(':memory:');
  });

  it('should reflect insumo cost and extra service cost in operative stats but not in global stats', async () => {
    // Setup
    insertPaciente({
      cedula_rif: 'V-1', nombre: 'Test', sexo: 'M', edad: 20, telefono: '1', correo: 'a@a.com', direccion: 'x'
    });
    const mId = insertMedico({
      nombre: 'Dr. Test', cedula_rif: 'M-1', telefono: '1', correo: 'm@m.com', especialidad: 'X'
    }).lastInsertRowid;
    
    const iId = insertInsumo({
      codigo: 'I-1', nombre: 'Insumo 1', descripcion: 'X', id_categoria: null, stock_actual: 0, stock_minimo: 1, unidad_medida: 'U', costo_unitario_usd: 1
    }).lastInsertRowid;
    
    registrarCompra({
      proveedor: 'Prov', items: [{ id_insumo: iId, cantidad: 10, costo_unitario_usd: 1 }]
    });
    
    const sId = insertServicio({
      nombre: 'Svc', precio_usd: 100, es_exento: 1, id_medico_defecto: mId, gasto_descripcion: 'Extra', gasto_precio_usd: 5
    }).lastInsertRowid;
    
    setServicioInsumos(sId, [{ id_insumo: iId, cantidad: 1 }]);
    
    const tasa = 36;
    registrarTasa(new Date().toISOString().split('T')[0], tasa);
    
    // Process Invoice
    const invoiceData = {
      id_paciente: 1,
      id_medico: mId,
      tasa_cambio: tasa,
      items: [{ id_servicio: sId, cantidad: 1, precio_usd: 100, es_exento: true }],
      totals: { subtotal_usd: 100, iva_usd: 0, total_usd: 100, total_ves: 3600 },
      commission: 10,
      requiredInsumos: [{ id_insumo: iId, cantidad_total: 1 }]
    };
    
    processInvoice(invoiceData);
    
    // Check Stats
    const stats = getDashboardStats();
    
    // Expected:
    // Global: Ingresos 100, Egresos (Comision 10 + Extra 5) = 15. Insumo (1) is NOT included.
    // Operative: Ingresos 100, Egresos (Comision 10 + Insumo 1 + Extra 5) = 16.
    
    console.log('STATS GLOBAL:', stats.kpis.globales);
    console.log('STATS OPERATIVO:', stats.kpis.operativos);
    console.log('TREND DATA:', stats.trend[0]);

    // Con la lógica de devengo (accrual):
    // Global: COSTO_INSUMO(1) + COMISION(10) + GASTO_EXTRA_SERVICIO(5) = 16
    // (COMPRA_INVENTARIO ya NO cuenta en el Dashboard, evita doble contabilidad)
    expect(stats.kpis.globales.egresos_totales).toBe(16);
    // Operative: COSTO_INSUMO(1) + COMISION(10) + GASTO_EXTRA_SERVICIO(5) = 16
    expect(stats.kpis.operativos.egresos_totales).toBe(16);
    
    // Trend Data
    expect(stats.trend[0].egresos_usd_global).toBe(16);
    expect(stats.trend[0].egresos_usd_operativo).toBe(16);
  });
});
