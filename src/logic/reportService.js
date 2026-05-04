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
      SUM(CASE WHEN categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN haber_usd ELSE 0 END) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(CASE WHEN categoria IN ('GASTO_OPERATIVO', 'PAGO_MEDICO', 'COMPRA_INVENTARIO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN haber_ves ELSE 0 END) as egresos_ves
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
    const doctors  = JSON.parse(localStorage.getItem('clinica_doctors_db') || '[]');
    const servicios = JSON.parse(localStorage.getItem('clinica_servicios') || '[]');
    const mapaServicios = {};

    for (const f of facturas) {
      const items = f.items || [];
      
      // Proporción de insumos por item (si hay 2 servicios, cada uno absorbe la mitad del costo_insumos_usd de la factura)
      const costoInsumosTotal = f.costo_insumos_usd || 0;
      const insumoPorItem = items.length > 0 ? (costoInsumosTotal / items.length) : 0;

      for (const item of items) {
        const nombre = item.nombre || 'Sin nombre';
        const precio = (item.precio_usd || 0) * (item.cantidad || 1);
        
        // Buscar el servicio para obtener su comisión y gasto extra
        const srv = servicios.find(s => Number(s.id) === Number(item.id_servicio));
        const comisionPorcentaje = srv ? (Number(srv.porcentaje_comision) / 100) : 0;
        const costo_comision    = precio * comisionPorcentaje;
        
        // Restar gasto extra asociado al servicio
        const costo_gasto_extra = srv ? (Number(srv.gasto_precio_usd) || 0) * (item.cantidad || 1) : 0;
        
        if (!mapaServicios[nombre]) mapaServicios[nombre] = { nombre, ingresos_usd: 0, ganancia_neta_usd: 0 };
        mapaServicios[nombre].ingresos_usd     += precio;
        // Ganancia Neta = Ingreso - Comisión - Gasto Extra - Insumos
        mapaServicios[nombre].ganancia_neta_usd += (precio - costo_comision - costo_gasto_extra - insumoPorItem);
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
      SUM(fd.cantidad * fd.precio_unitario_usd * (IFNULL(s.porcentaje_comision, 0) / 100.0)) as total_comision_usd,
      SUM(fd.cantidad * IFNULL(s.gasto_precio_usd, 0)) as total_gasto_extra_usd,
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
    ORDER BY (total_ingreso_usd - total_comision_usd - total_gasto_extra_usd - IFNULL(total_insumos_usd, 0)) DESC
    LIMIT ?
  `;
  const results = db.prepare(query).all(limite);
  return results.map(r => ({
    nombre:           r.nombre,
    ingresos_usd:     round2(r.total_ingreso_usd),
    ganancia_neta_usd: round2(r.total_ingreso_usd - r.total_comision_usd - r.total_gasto_extra_usd - (r.total_insumos_usd || 0)),
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

    // Calcular KPIs
    let ingresos_usd = 0;
    let egresos_usd_totales = 0;
    let egresos_usd_operativos = 0;
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

      // ─── Sumar costos operativos guardados en la factura ─────────────
      const egr_comision    = f.commission_usd ?? (f.commission ?? 0);
      const egr_insumo      = f.costo_insumos_usd || 0;
      const egr_gasto_extra = f.gasto_extra_usd || 0;
      const egr_factura     = round2(egr_comision + egr_insumo + egr_gasto_extra);

      egresos_usd_totales    += egr_factura;
      egresos_usd_operativos += egr_factura;

      const dia = f.fecha ? f.fecha.split('T')[0] : 'sin-fecha';
      if (!mapaFecha[dia]) mapaFecha[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd_global: 0, egresos_usd_operativo: 0 };
      mapaFecha[dia].ingresos_usd         += ingreso;
      mapaFecha[dia].egresos_usd_global   += egr_factura;
      mapaFecha[dia].egresos_usd_operativo += egr_factura;
    }

    manuales.forEach(a => {
      const dia = a.fecha?.split('T')[0];
      if (!mapaFecha[dia]) mapaFecha[dia] = { fecha: dia, ingresos_usd: 0, egresos_usd_global: 0, egresos_usd_operativo: 0 };

      if (a.tipo === 'INGRESO') {
        const ing = a.debe_usd || (a.haber_usd || 0); // fallback in case of old corrupted data
        ingresos_usd += ing;
        mapaFecha[dia].ingresos_usd += ing;
      } else {
        const egr = a.haber_usd || 0;
        egresos_usd_totales += egr;
        // Solo sumamos a operativos si es algo que NO viene ya en la factura
        const isOperativo = ['GASTO_OPERATIVO'].includes(a.categoria);
        if (isOperativo) {
            egresos_usd_operativos += egr;
        }
        mapaFecha[dia].egresos_usd_global += egr;
        if (isOperativo) {
            mapaFecha[dia].egresos_usd_operativo += egr;
        }
      }
    });

    const trend = Object.values(mapaFecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(r => ({
        fecha:            r.fecha,
        ingresos_usd:     round2(r.ingresos_usd),
        egresos_usd_global: round2(r.egresos_usd_global),
        egresos_usd_operativo: round2(r.egresos_usd_operativo),
        egresos_usd:      round2(r.egresos_usd_global),
        ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd_global),
      }));

    const margenGlobal = ingresos_usd > 0 ? round2(((ingresos_usd - egresos_usd_totales) / ingresos_usd) * 100) : 0;
    const margenOperativo = ingresos_usd > 0 ? round2(((ingresos_usd - egresos_usd_operativos) / ingresos_usd) * 100) : 0;

    return {
      kpis: {
        globales: {
          ingresos_totales: round2(ingresos_usd),
          egresos_totales:  round2(egresos_usd_totales),
          ganancia_neta:   round2(ingresos_usd - egresos_usd_totales),
          margen_neto:     margenGlobal
        },
        operativos: {
          ingresos_totales: round2(ingresos_usd),
          egresos_totales:  round2(egresos_usd_operativos),
          ganancia_neta:   round2(ingresos_usd - egresos_usd_operativos),
          margen_neto:     margenOperativo
        }
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

  // NOTA CONTABLE (Accrual): PAGO_MEDICO es el pago en caja de una deuda ya devengada
  // como COMISION al momento de emitir la factura. Incluir ambos en el KPI duplica el
  // egreso. Solo COMISION, COSTO_INSUMO y GASTO_EXTRA_SERVICIO representan el costo
  // operativo real de cada servicio. GASTO_OPERATIVO son gastos administrativos fijos.
  const kpiQuery = `
    SELECT 
      SUM(a.debe_usd) as ingresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO', 'COSTO_INSUMO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN a.haber_usd ELSE 0 END) as egresos_usd_totales,
      SUM(CASE WHEN a.categoria IN ('COSTO_INSUMO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN a.haber_usd ELSE 0 END) as egresos_usd_operativos
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
  `;

  const kpis = db.prepare(kpiQuery).get(...params) || { ingresos_usd: 0, egresos_usd_totales: 0, egresos_usd_operativos: 0 };

  const ingresos = kpis.ingresos_usd || 0;
  const margenGlobal = ingresos > 0 ? round2(((ingresos - (kpis.egresos_usd_totales || 0)) / ingresos) * 100) : 0;
  const margenOperativo = ingresos > 0 ? round2(((ingresos - (kpis.egresos_usd_operativos || 0)) / ingresos) * 100) : 0;

  const flowQuery = `
    SELECT 
      DATE(a.fecha) as fecha_dia,
      SUM(a.debe_usd) as ingresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO', 'COSTO_INSUMO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN a.haber_usd ELSE 0 END) as egresos_usd_global,
      SUM(CASE WHEN a.categoria IN ('COSTO_INSUMO', 'COMISION', 'GASTO_EXTRA_SERVICIO') THEN a.haber_usd ELSE 0 END) as egresos_usd_operativo
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY DATE(a.fecha)
    ORDER BY DATE(a.fecha) ASC
  `;
  const trend = db.prepare(flowQuery).all(...params).map(r => ({
    fecha:               r.fecha_dia,
    ingresos_usd:        round2(r.ingresos_usd || 0),
    egresos_usd_global:  round2(r.egresos_usd_global || 0),
    egresos_usd_operativo: round2(r.egresos_usd_operativo || 0),
    // Por compatibilidad con el gráfico actual, enviamos egresos_usd por defecto (global)
    egresos_usd:         round2(r.egresos_usd_global || 0),
    ganancia_neta_usd:   round2((r.ingresos_usd || 0) - (r.egresos_usd_global || 0)),
  }));

  return {
    kpis: {
      globales: {
        ingresos_totales: round2(ingresos),
        egresos_totales:  round2(kpis.egresos_usd_totales || 0),
        ganancia_neta:   round2(ingresos - (kpis.egresos_usd_totales || 0)),
        margen_neto:     margenGlobal
      },
      operativos: {
        ingresos_totales: round2(ingresos),
        egresos_totales:  round2(kpis.egresos_usd_operativos || 0),
        ganancia_neta:   round2(ingresos - (kpis.egresos_usd_operativos || 0)),
        margen_neto:     margenOperativo
      }
    },
    trend,
  };
};

// ──────────────────────────────────────────────────────────────────────
// Ingresos por Servicio y por Médico (Nuevos Gráficos)
// ──────────────────────────────────────────────────────────────────────
export const getIngresosPorServicio = (startDate = null, endDate = null) => {
  if (IS_BROWSER_MODE) {
    const facturas = _filtrarPorFecha(_getFacturasLocal(), startDate, endDate);
    const mapa = {};
    facturas.forEach(f => {
      (f.items || []).forEach(item => {
        const nombre = item.nombre || 'Sin nombre';
        if (!mapa[nombre]) mapa[nombre] = { nombre, ingresos_usd: 0 };
        mapa[nombre].ingresos_usd += (item.precio_usd || 0) * (item.cantidad || 1);
      });
    });
    return Object.values(mapa).sort((a, b) => b.ingresos_usd - a.ingresos_usd).map(r => ({ ...r, ingresos_usd: round2(r.ingresos_usd) }));
  }

  const params = [];
  let dateClause = '';
  if (startDate) { dateClause += ' AND DATE(f.fecha) >= ?'; params.push(startDate); }
  if (endDate)   { dateClause += ' AND DATE(f.fecha) <= ?'; params.push(endDate); }

  const query = `
    SELECT s.nombre, SUM(fd.cantidad * fd.precio_unitario_usd) as ingresos_usd
    FROM factura_detalles fd
    JOIN facturas f ON fd.id_factura = f.id
    JOIN servicios s ON fd.id_servicio = s.id
    WHERE 1=1 ${dateClause}
    GROUP BY s.id
    ORDER BY ingresos_usd DESC
  `;
  return getDb().prepare(query).all(...params).map(r => ({ nombre: r.nombre, ingresos_usd: round2(r.ingresos_usd || 0) }));
};

export const getIngresosPorMedico = (startDate = null, endDate = null) => {
  if (IS_BROWSER_MODE) {
    const facturas = _filtrarPorFecha(_getFacturasLocal(), startDate, endDate);
    const doctors = JSON.parse(localStorage.getItem('clinica_doctors_db') || '[]');
    const mapa = {};
    facturas.forEach(f => {
      const medico = doctors.find(d => Number(d.id) === Number(f.id_medico));
      const nombre = medico ? medico.nombre : 'Sin médico';
      if (!mapa[nombre]) mapa[nombre] = { nombre, ingresos_usd: 0 };
      mapa[nombre].ingresos_usd += (f.total_usd || 0);
    });
    return Object.values(mapa).sort((a, b) => b.ingresos_usd - a.ingresos_usd).map(r => ({ ...r, ingresos_usd: round2(r.ingresos_usd) }));
  }

  const params = [];
  let dateClause = '';
  if (startDate) { dateClause += ' AND DATE(f.fecha) >= ?'; params.push(startDate); }
  if (endDate)   { dateClause += ' AND DATE(f.fecha) <= ?'; params.push(endDate); }

  const query = `
    SELECT m.nombre, SUM(f.total_usd) as ingresos_usd
    FROM facturas f
    LEFT JOIN medicos m ON f.id_medico = m.id
    WHERE 1=1 ${dateClause}
    GROUP BY f.id_medico
    ORDER BY ingresos_usd DESC
  `;
  return getDb().prepare(query).all(...params).map(r => ({ nombre: r.nombre || 'Sin médico', ingresos_usd: round2(r.ingresos_usd || 0) }));
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
