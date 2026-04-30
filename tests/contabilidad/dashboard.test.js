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
    expect(stats.kpis.ingresos_totales).toBe(0);
    expect(stats.kpis.margen_neto).toBe(0);
    expect(stats.trend).toHaveLength(0);
  });

  it('debe calcular márgenes correctamente con una factura', () => {
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('INGRESO', 'SERVICIO', 100, 0, '2026-04-29')").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'COMISION', 0, 20, '2026-04-29')").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha, categoria) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 10, '2026-04-29', 'GASTO_OPERATIVO')").run();

    const stats = getDashboardStats({ startDate: '2026-04-29', endDate: '2026-04-29' });
    
    // Ingresos: 100
    // Egresos Totales: 30
    // Ganancia Neta: 70
    // Margen Neto (Global): ((100 - 30) / 100) * 100 = 70%
    expect(stats.kpis.ingresos_totales).toBe(100);
    expect(stats.kpis.ganancia_neta).toBe(70);
    expect(stats.kpis.margen_neto).toBe(70);
  });

  it('debe usar Margen de Contribución al filtrar por médico (ignorando fijos)', () => {
    // Mocking medicos and facturas to allow JOIN
    db.prepare("INSERT INTO medicos (id, nombre) VALUES (99, 'Dr. Test')").run();
    db.prepare("INSERT INTO facturas (id, id_medico, total_usd) VALUES (1, 99, 100)").run();
    
    // Asientos vinculados a la factura (Ingreso y Comisión)
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha, referencia_id) VALUES ('INGRESO', 'SERVICIO', 100, 0, '2026-04-29', 1)").run();
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha, referencia_id) VALUES ('EGRESO', 'COMISION', 0, 20, '2026-04-29', 1)").run();
    
    // Asiento de gasto operativo (FIJO) - sin referencia_id o no vinculado al filtro
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 10, '2026-04-29')").run();

    const stats = getDashboardStats({ medicos: [99] });
    
    // Ingresos filtrados: 100
    // Egresos Directos filtrados: 20
    // Margen Contribución: ((100 - 20) / 100) * 100 = 80%
    expect(stats.kpis.ingresos_totales).toBe(100);
    expect(stats.kpis.margen_neto).toBe(80);
    expect(stats.kpis.is_margen_contribucion).toBe(true);
  });

  it('debe proteger contra división por cero', () => {
    db.prepare("INSERT INTO contabilidad_asientos (tipo, categoria, debe_usd, haber_usd, fecha) VALUES ('EGRESO', 'GASTO_OPERATIVO', 0, 50, '2026-04-29')").run();
    
    const stats = getDashboardStats();
    expect(stats.kpis.ingresos_totales).toBe(0);
    expect(stats.kpis.margen_neto).toBe(0);
  });
});
