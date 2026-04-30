import { getDb } from '../db/manager';

// ─────────────────────────────────────────────────────────────────────────────
// Detección de entorno
// ─────────────────────────────────────────────────────────────────────────────
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
const IS_BROWSER_MODE = isBrowser && !isTest;

// localStorage keys (deben coincidir con manager.js)
const INVOICES_KEY = 'clinica_facturas_db';
const INSUMOS_KEY  = 'clinica_insumos';

const round2 = (num) => Math.round(num * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de localStorage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lee todas las facturas del localStorage y normaliza los totales.
 */
const _getFacturasLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    return raw.map(f => ({
      ...f,
      total_usd:    f.totals?.total_usd    ?? f.total_usd    ?? 0,
      subtotal_usd: f.totals?.subtotal_usd ?? f.subtotal_usd ?? 0,
      total_ves:    f.totals?.total_ves    ?? f.total_ves    ?? 0,
    }));
  } catch {
    return [];
  }
};

/**
 * Filtra facturas por rango de fechas (strings 'YYYY-MM-DD').
 */
const _filtrarPorFecha = (facturas, startDate, endDate) => {
  return facturas.filter(f => {
    if (!f.fecha) return false;
    const d = f.fecha.split('T')[0];
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    return true;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// KPIs del día (uso interno / CashClosing)
// ─────────────────────────────────────────────────────────────────────────────
export const getKpiDia = () => {
  if (IS_BROWSER_MODE) {
    const hoy = new Date().toISOString().split('T')[0];
    const facturas = _getFacturasLocal().filter(f => f.fecha && f.fecha.startsWith(hoy));
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]')
      .filter(l => l.fecha_pago === hoy);
    const manuales = JSON.parse(localStorage.getItem('clinica_asientos_manuales') || '[]')
      .filter(a => a.fecha && a.fecha.startsWith(hoy));

    const ingresos_usd = facturas.reduce((acc, f) => acc + (f.total_usd || 0), 0);
    const egresos_usd  = liquidaciones.reduce((acc, l) => acc + (l.monto_pagado_usd || 0), 0) +
                         manuales.reduce((acc, a) => acc + (a.haber_usd || 0), 0);

    return {
      ingresos:     { usd: round2(ingresos_usd), ves: 0 },
      egresos:      { usd: round2(egresos_usd),  ves: 0 },
      ganancia_neta:{ usd: round2(ingresos_usd - egresos_usd), ves: 0 },
    };
  }

  const db  = getDb();
  const hoy = new Date().toISOString().split('T')[0];
  const query = `
    SELECT 
      SUM(debe_usd) as ingresos_usd,
      SUM(CASE WHEN categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION') THEN haber_usd ELSE 0 END) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(CASE WHEN categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION') THEN haber_ves ELSE 0 END) as egresos_ves
    FROM contabilidad_asientos
    WHERE DATE(fecha) = ?
  `;
  const result = db.prepare(query).get(hoy) || { ingresos_usd: 0, egresos_usd: 0, ingresos_ves: 0, egresos_ves: 0 };
  return {
    ingresos:     { usd: round2(result.ingresos_usd || 0), ves: round2(result.ingresos_ves || 0) },
    egresos:      { usd: round2(result.egresos_usd  || 0), ves: round2(result.egresos_ves  || 0) },
    ganancia_neta:{ usd: round2((result.ingresos_usd || 0) - (result.egresos_usd || 0)), ves: round2((result.ingresos_ves || 0) - (result.egresos_ves || 0)) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Top Servicios (widget del dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const getTopServicios = (limite = 5) => {
  if (IS_BROWSER_MODE) {
    const facturas = _getFacturasLocal();
    const doctors = JSON.parse(localStorage.getItem('clinica_doctors_db') || '[]');
    const mapaServicios = {};

    for (const f of facturas) {
      const doctor = doctors.find(d => Number(d.id) === Number(f.id_medico));
      const comisionPorcentaje = doctor ? (doctor.porcentaje_comision / 100) : 0;
      const items = f.items || [];
      for (const item of items) {
        const nombre = item.nombre || 'Sin nombre';
        const precio = (item.precio_usd || 0) * (item.cantidad || 1);
        const costo_comision = precio * comisionPorcentaje;
        if (!mapaServicios[nombre]) mapaServicios[nombre] = { nombre, ingresos_usd: 0, ganancia_neta_usd: 0 };
        mapaServicios[nombre].ingresos_usd     += precio;
        mapaServicios[nombre].ganancia_neta_usd += (precio - costo_comision);
      }
    }

    return Object.values(mapaServicios)
      .sort((a, b) => b.ingresos_usd - a.ingresos_usd)
      .slice(0, limite)
      .map(r => ({ nombre: r.nombre, ingresos_usd: round2(r.ingresos_usd), ganancia_neta_usd: round2(r.ganancia_neta_usd) }));
  }

  const db = getDb();
  const query = `
    SELECT 
      s.nombre,
      SUM(fd.cantidad * fd.precio_unitario_usd) as total_ingreso_usd,
      SUM(fd.cantidad * fd.precio_unitario_usd * (IFNULL(m.porcentaje_comision, 0) / 100.0)) as total_comision_usd,
      (
        SELECT SUM(haber_usd) 
        FROM contabilidad_asientos a
        JOIN facturas f ON a.referencia_id = f.id
        WHERE f.id IN (SELECT id_factura FROM factura_detalles WHERE id_servicio = s.id)
        AND a.categoria = 'COSTO_INSUMO'
      ) as total_insumos_usd
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    JOIN facturas f2 ON fd.id_factura = f2.id
    LEFT JOIN medicos m ON f2.id_medico = m.id
    GROUP BY s.id
    ORDER BY (total_ingreso_usd - total_comision_usd - IFNULL(total_insumos_usd, 0)) DESC
    LIMIT ?
  `;
  const results = db.prepare(query).all(limite);
  return results.map(r => ({
    nombre:           r.nombre,
    ingresos_usd:     round2(r.total_ingreso_usd),
    ganancia_neta_usd: round2(r.total_ingreso_usd - r.total_comision_usd - (r.total_insumos_usd || 0)),
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Alertas de Stock
// ─────────────────────────────────────────────────────────────────────────────
export const getStockAlertas = () => {
  if (IS_BROWSER_MODE) {
    try {
      const insumos = JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
      return insumos.filter(i => (i.stock_actual || 0) <= (i.stock_minimo || 0));
    } catch {
      return [];
    }
  }

  try {
    const db = getDb();
    return db.prepare(`
      SELECT i.*, c.nombre AS categoria
      FROM insumos i
      LEFT JOIN categorias_insumos c ON i.id_categoria = c.id
      WHERE i.stock_actual <= i.stock_minimo
      ORDER BY i.stock_actual ASC
    `).all();
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Historial de Tasas
// ─────────────────────────────────────────────────────────────────────────────
export const getAuditoriaTasas = (limite = 15) => {
  if (IS_BROWSER_MODE) {
    try {
      const tasas = JSON.parse(localStorage.getItem('clinica_historial_tasas') || '[]');
      return tasas.slice(0, limite);
    } catch {
      return [];
    }
  }
  const db = getDb();
  return db.prepare('SELECT * FROM historial_tasas ORDER BY fecha DESC LIMIT ?').all(limite);
};

// ─────────────────────────────────────────────────────────────────────────────
// Flujo Diario (Bimoneda)
// ─────────────────────────────────────────────────────────────────────────────
export const getFlujoDiario = (diasAtras = 7) => {
  if (IS_BROWSER_MODE) {
    const facturas = _getFacturasLocal();
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]');
    const manuales = JSON.parse(localStorage.getItem('clinica_asientos_manuales') || '[]');
    
    const mapa = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - diasAtras);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const process = (date, ing, egr) => {
      const dia = date.split('T')[0];
      if (dia < cutoffStr) return;
      if (!mapa[dia]) mapa[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd: 0 };
      mapa[dia].ingresos_usd += ing;
      mapa[dia].egresos_usd += egr;
    };

    facturas.forEach(f => process(f.fecha, f.total_usd || 0, 0));
    liquidaciones.forEach(l => process(l.fecha_pago, 0, l.monto_pagado_usd || 0));
    manuales.forEach(a => process(a.fecha, a.debe_usd || 0, a.haber_usd || 0));

    return Object.values(mapa)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(r => ({ 
        ...r, 
        ingresos_usd: round2(r.ingresos_usd), 
        egresos_usd: round2(r.egresos_usd), 
        ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd) 
      }));
  }

  const db = getDb();
  const query = `
    SELECT 
      DATE(fecha) as fecha,
      SUM(debe_usd) as ingresos_usd,
      SUM(haber_usd) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(haber_ves) as egresos_ves
    FROM contabilidad_asientos
    WHERE fecha >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(fecha)
    ORDER BY fecha ASC
  `;
  return db.prepare(query).all(diasAtras).map(r => ({
    ...r,
    ingresos_usd:     round2(r.ingresos_usd),
    egresos_usd:      round2(r.egresos_usd),
    ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd),
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Diferencia de Caja (sin cambios)
// ─────────────────────────────────────────────────────────────────────────────
export const calcularDiferenciaCaja = (declarado, teorico) => {
  const diferencia = round2(declarado - teorico);
  let estado = 'OK';
  if (Math.abs(diferencia) > 5)  estado = 'FALTANTE';
  else if (Math.abs(diferencia) > 0) estado = 'ALERTA';
  return { diferencia, estado };
};

// ─────────────────────────────────────────────────────────────────────────────
// Liquidación por Médico (sin cambios)
// ─────────────────────────────────────────────────────────────────────────────
export const getLiquidacionPorMedico = (fechaDesde, fechaHasta) => {
  const { getResumenComisionesPorMedico } = require('../db/manager');
  return getResumenComisionesPorMedico();
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats — FUNCIÓN PRINCIPAL del módulo de Contabilidad
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = (filters = {}) => {

  // ── MODO NAVEGADOR (localStorage) ────────────────────────────────────────
  if (IS_BROWSER_MODE) {
    const { startDate, endDate } = filters;
    let facturas = _getFacturasLocal();

    // Aplicar filtro de fechas
    if (startDate || endDate) {
      facturas = _filtrarPorFecha(facturas, startDate, endDate);
    }

    // Calcular KPIs iterando sobre facturas
    // Calcular KPIs
    let ingresos_usd = 0;
    let egresos_usd = 0;
    const mapaFecha = {};

    // Egresos manuales y liquidaciones en el rango
    const liquidaciones = JSON.parse(localStorage.getItem('clinica_liquidaciones_db') || '[]')
      .filter(l => (!startDate || l.fecha_pago >= startDate) && (!endDate || l.fecha_pago <= endDate));
    const manuales = JSON.parse(localStorage.getItem('clinica_asientos_manuales') || '[]')
      .filter(a => {
        const d = a.fecha?.split('T')[0];
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      });

    for (const f of facturas) {
      const ingreso = f.total_usd || 0;
      ingresos_usd += ingreso;
      const dia = f.fecha ? f.fecha.split('T')[0] : 'sin-fecha';
      if (!mapaFecha[dia]) mapaFecha[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd: 0 };
      mapaFecha[dia].ingresos_usd += ingreso;
    }

    liquidaciones.forEach(l => {
      const egr = l.monto_pagado_usd || 0;
      egresos_usd += egr;
      const dia = l.fecha_pago;
      if (!mapaFecha[dia]) mapaFecha[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd: 0 };
      mapaFecha[dia].egresos_usd += egr;
    });

    manuales.forEach(a => {
      const egr = a.haber_usd || 0;
      egresos_usd += egr;
      const dia = a.fecha?.split('T')[0];
      if (!mapaFecha[dia]) mapaFecha[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd: 0 };
      mapaFecha[dia].egresos_usd += egr;
    });

    const trend = Object.values(mapaFecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(r => ({
        fecha:            r.fecha,
        ingresos_usd:     round2(r.ingresos_usd),
        egresos_usd:      round2(r.egresos_usd),
        ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd),
      }));

    const margen = ingresos_usd > 0 ? round2(((ingresos_usd - egresos_usd) / ingresos_usd) * 100) : 0;

    return {
      kpis: {
        ingresos_totales:     round2(ingresos_usd),
        egresos_totales:      round2(egresos_usd),
        ganancia_neta:        round2(ingresos_usd - egresos_usd),
        margen_neto:          margen,
        is_margen_contribucion: false,
      },
      trend,
    };
  }

  // ── MODO SQLITE (Electron / tests) ───────────────────────────────────────
  const db = getDb();
  const { startDate, endDate, medicos = [], servicios = [] } = filters;

  let whereClauses = ['1=1'];
  let params = [];

  if (startDate) { whereClauses.push('DATE(a.fecha) >= ?'); params.push(startDate); }
  if (endDate)   { whereClauses.push('DATE(a.fecha) <= ?'); params.push(endDate);   }

  let joinClause = '';
  if ((medicos && medicos.length > 0) || (servicios && servicios.length > 0)) {
    joinClause = 'JOIN facturas f ON a.referencia_id = f.id';
    if (medicos && medicos.length > 0) {
      whereClauses.push(`f.id_medico IN (${medicos.map(() => '?').join(',')})`);
      params.push(...medicos);
    }
    if (servicios && servicios.length > 0) {
      whereClauses.push(`f.id IN (SELECT id_factura FROM factura_detalles WHERE id_servicio IN (${servicios.map(() => '?').join(',')}))`);
      params.push(...servicios);
    }
  }

  const kpiQuery = `
    SELECT 
      SUM(a.debe_usd) as ingresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION') THEN a.haber_usd ELSE 0 END) as egresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION') THEN a.haber_usd ELSE 0 END) as egresos_fijos,
      SUM(CASE WHEN a.categoria IN ('PAGO_MEDICO', 'COSTO_INSUMO', 'COMISION') THEN a.haber_usd ELSE 0 END) as egresos_directos
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
  `;

  const kpis = db.prepare(kpiQuery).get(...params) || { ingresos_usd: 0, egresos_usd: 0, egresos_fijos: 0, egresos_directos: 0 };

  const isFiltrado = (medicos && medicos.length > 0) || (servicios && servicios.length > 0);
  const ingresos = kpis.ingresos_usd || 0;
  const egresosParaMargen = isFiltrado ? (kpis.egresos_directos || 0) : (kpis.egresos_usd || 0);
  const margen = ingresos > 0 ? round2(((ingresos - egresosParaMargen) / ingresos) * 100) : 0;

  const flowQuery = `
    SELECT 
      DATE(a.fecha) as fecha_dia,
      SUM(a.debe_usd) as ingresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION') THEN a.haber_usd ELSE 0 END) as egresos_usd
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY DATE(a.fecha)
    ORDER BY DATE(a.fecha) ASC
  `;
  const trend = db.prepare(flowQuery).all(...params).map(r => ({
    fecha:            r.fecha_dia,
    ingresos_usd:     round2(r.ingresos_usd || 0),
    egresos_usd:      round2(r.egresos_usd  || 0),
    ganancia_neta_usd: round2((r.ingresos_usd || 0) - (r.egresos_usd || 0)),
  }));

  return {
    kpis: {
      ingresos_totales:     round2(ingresos),
      egresos_totales:      round2(kpis.egresos_usd || 0),
      ganancia_neta:        round2(ingresos - (kpis.egresos_usd || 0)),
      margen_neto:          margen,
      is_margen_contribucion: isFiltrado,
    },
    trend,
  };
};

export default {
  getKpiDia,
  getTopServicios,
  getStockAlertas,
  getFlujoDiario,
  getAuditoriaTasas,
  calcularDiferenciaCaja,
  getLiquidacionPorMedico,
  getDashboardStats,
};
