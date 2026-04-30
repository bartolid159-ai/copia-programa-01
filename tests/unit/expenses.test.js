/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { 
  getDb, 
  closeDb, 
  getCategoriasGastos, 
  insertCategoriaGasto, 
  getHistorialEgresos, 
  insertAsientoManual,
  insertGastoTemplate,
  getGastoTemplates,
  deleteAsientoManual
} from '../../src/db/manager.js';

describe('Gestión de Gastos y Egresos', () => {
  beforeEach(() => {
    closeDb();
    getDb(':memory:');
  });

  it('debe inicializar y permitir añadir nuevas categorías de gastos', () => {
    const cats = getCategoriasGastos();
    expect(cats).toContain('GASTO_OPERATIVO');
    expect(cats).toContain('ALQUILER');

    insertCategoriaGasto('Publicidad Digital');
    const updatedCats = getCategoriasGastos();
    expect(updatedCats).toContain('PUBLICIDAD_DIGITAL');
  });

  it('debe registrar y recuperar egresos en el historial', () => {
    insertAsientoManual({
      tipo: 'EGRESO',
      categoria: 'ALQUILER',
      debe_usd: 0,
      haber_usd: 500,
      debe_ves: 0,
      haber_ves: 0,
      tasa_referencia: 1,
      descripcion: 'Alquiler Local',
      fecha: '2026-05-01T12:00:00'
    });

    const historial = getHistorialEgresos();
    expect(historial.length).toBeGreaterThan(0);
    expect(historial[0].descripcion).toBe('Alquiler Local');
    expect(historial[0].categoria).toBe('ALQUILER');
  });

  it('debe gestionar plantillas múltiples con JSON', () => {
    const items = [
      { descripcion: 'Luz', monto: 50, categoria: 'SERVICIOS' },
      { descripcion: 'Agua', monto: 20, categoria: 'SERVICIOS' }
    ];

    insertGastoTemplate({
      nombre: 'Servicios Básicos',
      items_json: JSON.stringify(items),
      monto_estimado_usd: 70
    });

    const templates = getGastoTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].nombre).toBe('Servicios Básicos');
    
    const savedItems = JSON.parse(templates[0].items_json);
    expect(savedItems).toHaveLength(2);
    expect(savedItems[0].descripcion).toBe('Luz');
  });

  it('debe eliminar un egreso del historial correctamente', () => {
    insertAsientoManual({
      tipo: 'EGRESO',
      categoria: 'GASTO_OPERATIVO',
      debe_usd: 0,
      haber_usd: 100,
      debe_ves: 0,
      haber_ves: 100,
      tasa_referencia: 1,
      descripcion: 'Gasto de Prueba',
      fecha: '2026-05-01T12:00:00'
    });

    let historial = getHistorialEgresos();
    const targetId = historial[0].id;
    
    const success = deleteAsientoManual(targetId);
    expect(success).toBe(true);

    historial = getHistorialEgresos();
    expect(historial.find(a => a.id === targetId)).toBeUndefined();
  });

  it('no debe permitir eliminar un registro que no sea tipo EGRESO', () => {
    // Insertamos un INGRESO manualmente (aunque usualmente vienen de facturas)
    insertAsientoManual({
      tipo: 'INGRESO',
      categoria: 'HONORARIOS',
      debe_usd: 100,
      haber_usd: 0,
      debe_ves: 100,
      haber_ves: 0,
      tasa_referencia: 1,
      descripcion: 'Ingreso no borrable',
      fecha: '2026-05-01T12:00:00'
    });

    const db = getDb();
    const target = db.prepare("SELECT id FROM contabilidad_asientos WHERE tipo = 'INGRESO'").get();
    
    const success = deleteAsientoManual(target.id);
    expect(success).toBe(false);

    const exists = db.prepare("SELECT 1 FROM contabilidad_asientos WHERE id = ?").get(target.id);
    expect(exists).toBeDefined();
  });
});
