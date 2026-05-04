import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDb, closeDb } from '../../src/db/manager';
import { getDashboardStats } from '../../src/logic/reportService';

describe('Dashboard Contable - Flujo de Negocio', () => {
  let db;

  beforeEach(() => {
    // Forzamos entorno test para usar memoria
    process.env.NODE_ENV = 'test';
    db = getDb(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  it('debe manejar el estado inicial N=1 (sin datos)', () => {
    const stats = getDashboardStats();
    expect(stats.kpis.globales.ingresos_totales).toBe(0);
    expect(stats.kpis.globales.margen_neto).toBe(0);
    expect(stats.trend).toHaveLength(0);
  });

  it('debe calcular márgenes correctamente con una factura', () => {
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('INGRESO', 'SERVICIO', 100, 0, '2026-04-29')").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'COMISION', 0, 20, '2026-04-29')").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 10, '2026-04-29')").run();

    const stats = getDashboardStats({ startDate: '2026-04-29', endDate: '2026-04-29' });
    
    // Ingresos: 100
    // Egresos Totales: 30 (20 medico + 10 operativo)
    // Ganancia Neta: 70
    // Margen Neto (Global): ((100 - 30) / 100) * 100 = 70%
    expect(stats.kpis.globales.ingresos_totales).toBe(100);
    expect(stats.kpis.globales.ganancia_neta).toBe(70);
    expect(stats.kpis.globales.margen_neto).toBe(70);

    // Operativos: Solo 20 (pago medico)
    // Margen Operativo: ((100 - 20) / 100) * 100 = 80%
    expect(stats.kpis.operativos.egresos_totales).toBe(20);
    expect(stats.kpis.operativos.margen_neto).toBe(80);
  });

  it('debe usar Margen de Contribución al filtrar por médico (ignorando fijos)', () => {
    // Mocking medicos and facturas to allow JOIN
    db.prepare("INSERT INTO medicos (id, nombre) VALUES (99, 'Dr. Test')").run();
    db.prepare("INSERT INTO facturas (id, id_medico, total_usd) VALUES (1, 99, 100)").run();
    
    // Asientos vinculados a la factura (Ingreso y Liquidación Médica)
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha, referencia_id) VALUES ('INGRESO', 'SERVICIO', 100, 0, '2026-04-29', 1)").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha, referencia_id) VALUES ('EGRESO', 'COMISION', 0, 20, '2026-04-29', 1)").run();
    
    // Asiento de gasto operativo (FIJO) - sin referencia_id o no vinculado al filtro
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 10, '2026-04-29')").run();

    const stats = getDashboardStats({ medicos: [99] });
    
    // Ingresos filtrados: 100
    // Egresos Directos filtrados: 20
    // Margen Contribución: ((100 - 20) / 100) * 100 = 80%
    expect(stats.kpis.globales.ingresos_totales).toBe(100);
    expect(stats.kpis.globales.margen_neto).toBe(80);
    // Nota: is_margen_contribucion ya no se usa porque tenemos kpis.operativos explícitos
  });

  it('debe proteger contra división por cero', () => {
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 50, '2026-04-29')").run();
    
    const stats = getDashboardStats();
    expect(stats.kpis.globales.ingresos_totales).toBe(0);
    expect(stats.kpis.globales.margen_neto).toBe(0);
  });

  it('debe usar contabilidad por devengo (ignorar compras, usar costo insumo)', () => {
    // 1. Ingreso de 100
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('INGRESO', 'SERVICIO', 100, 0, '2026-04-29')").run();
    
    // 2. Compra de inventario de 500 (No debería afectar la ganancia neta en modo devengo)
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'COMPRA_INVENTARIO', 0, 500, '2026-04-29')").run();
    
    // 3. Costo de insumo usado de 5 (Sí debería afectar)
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'COSTO_INSUMO', 0, 5, '2026-04-29')").run();

    const stats = getDashboardStats({ startDate: '2026-04-29', endDate: '2026-04-29' });

    // Ingresos: 100
    // Egresos: 5 (Costo Insumo) + 0 (Compra ignorada)
    // Ganancia: 95
    expect(stats.kpis.globales.ganancia_neta).toBe(95);
    expect(stats.kpis.globales.egresos_totales).toBe(5);
  });
});
