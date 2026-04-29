import { getDb } from '../db/manager';

const round2 = (num) => Math.round(num * 100) / 100;

/**
 * Obtiene KPIs financieros del día actual (Bimoneda)
 */
export const getKpiDia = () => {
  const db = getDb();
  const hoy = new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      SUM(debe_usd) as ingresos_usd,
      SUM(haber_usd) as egresos_usd,
      SUM(debe_ves) as ingresos_ves,
      SUM(haber_ves) as egresos_ves
    FROM contabilidad_asientos
    WHERE DATE(fecha) = ?
  `;
  
  const result = db.prepare(query).get(hoy) || { ingresos_usd: 0, egresos_usd: 0, ingresos_ves: 0, egresos_ves: 0 };
  
  return {
    ingresos: { usd: round2(result.ingresos_usd || 0), ves: round2(result.ingresos_ves || 0) },
    egresos: { usd: round2(result.egresos_usd || 0), ves: round2(result.egresos_ves || 0) },
    ganancia_neta: { 
      usd: round2((result.ingresos_usd || 0) - (result.egresos_usd || 0)),
      ves: round2((result.ingresos_ves || 0) - (result.egresos_ves || 0))
    }
  };
};

/**
 * Obtiene los servicios más rentables (Pareto Real: Ingreso - Costos)
 */
export const getTopServicios = (limite = 5) => {
  const db = getDb();
  const query = `
    SELECT 
      s.nombre,
      SUM(fd.cantidad * fd.precio_unitario_usd) as total_ingreso_usd,
      (
        SELECT SUM(haber_usd) 
        FROM contabilidad_asientos a
        JOIN facturas f ON a.referencia_id = f.id
        WHERE f.id IN (SELECT id_factura FROM factura_detalles WHERE id_servicio = s.id)
        AND a.categoria IN ('COMISION', 'COSTO_INSUMO')
      ) as total_egreso_usd
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    GROUP BY s.id
    ORDER BY (total_ingreso_usd - IFNULL(total_egreso_usd, 0)) DESC
    LIMIT ?
  `;
  const results = db.prepare(query).all(limite);
  return results.map(r => ({
    nombre: r.nombre,
    ingresos_usd: round2(r.total_ingreso_usd),
    ganancia_neta_usd: round2(r.total_ingreso_usd - (r.total_egreso_usd || 0))
  }));
};

/**
 * Alertas de Stock (Crítico <= Mínimo)
 */
export const getStockAlertas = () => {
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
    console.error("Error fetching stock alerts:", error);
    return [];
  }
};

/**
 * Obtiene historial de tasas de cambio
 */
export const getAuditoriaTasas = (limite = 15) => {
  const db = getDb();
  return db.prepare('SELECT * FROM historial_tasas ORDER BY fecha DESC LIMIT ?').all(limite);
};

/**
 * Flujo de Caja (Bimoneda)
 */
export const getFlujoDiario = (diasAtras = 7) => {
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
    ingresos_usd: round2(r.ingresos_usd),
    egresos_usd: round2(r.egresos_usd),
    ganancia_neta_usd: round2(r.ingresos_usd - r.egresos_usd)
  }));
};


/**
 * Calcula la diferencia entre lo declarado y lo teórico y retorna el estado del semáforo.
 * @param {number} declarado - Monto declarado por el cajero (USD)
 * @param {number} teorico - Monto teórico registrado en el sistema (USD)
 * @returns {Object} { diferencia, estado }
 */
export const calcularDiferenciaCaja = (declarado, teorico) => {
  const diferencia = round2(declarado - teorico);
  let estado = 'OK';
  
  if (Math.abs(diferencia) > 5) {
    estado = 'FALTANTE';
  } else if (Math.abs(diferencia) > 0) {
    estado = 'ALERTA';
  }
  
  return { diferencia, estado };
};

/**
 * Consolida el reporte de liquidación por médico para el período dado.
 * @param {string} [fechaDesde]
 * @param {string} [fechaHasta]
 */
export const getLiquidacionPorMedico = (fechaDesde, fechaHasta) => {
  const { getResumenComisionesPorMedico, getComisionesMedico } = require('../db/manager');
  return getResumenComisionesPorMedico();
};

/**
 * Dashboard de Flujo de Negocio en Tiempo Real (Filtros granulares)
 * @param {Object} filters - { startDate, endDate, medicos, servicios }
 */
export const getDashboardStats = (filters = {}) => {
  const db = getDb();
  const { startDate, endDate, medicos = [], servicios = [] } = filters;
  
  let whereClauses = ["1=1"];
  let params = [];

  if (startDate) {
    whereClauses.push("DATE(a.fecha) >= ?");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("DATE(a.fecha) <= ?");
    params.push(endDate);
  }

  let joinClause = "";
  if ((medicos && medicos.length > 0) || (servicios && servicios.length > 0)) {
     joinClause = "JOIN facturas f ON a.referencia_id = f.id";
     if (medicos && medicos.length > 0) {
        const placeholders = medicos.map(() => '?').join(',');
        whereClauses.push(`f.id_medico IN (${placeholders})`);
        params.push(...medicos);
     }
     if (servicios && servicios.length > 0) {
        const placeholders = servicios.map(() => '?').join(',');
        whereClauses.push(`f.id IN (SELECT id_factura FROM factura_detalles WHERE id_servicio IN (${placeholders}))`);
        params.push(...servicios);
     }
  }

  // KPIs Financieros
  const kpiQuery = `
    SELECT 
      SUM(a.debe_usd) as ingresos_usd,
      SUM(a.haber_usd) as egresos_usd,
      SUM(CASE WHEN a.categoria IN ('GASTO_OPERATIVO') THEN a.haber_usd ELSE 0 END) as egresos_fijos,
      SUM(CASE WHEN a.categoria IN ('COMISION', 'COSTO_INSUMO') THEN a.haber_usd ELSE 0 END) as egresos_directos
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
  `;

  const kpis = db.prepare(kpiQuery).get(...params) || { ingresos_usd: 0, egresos_usd: 0, egresos_fijos: 0, egresos_directos: 0 };
  
  // Lógica de Margen (Chain of Thought)
  // Si hay filtros, usamos margen de contribución (Ingresos - Costos Directos)
  const isFiltrado = (medicos && medicos.length > 0) || (servicios && servicios.length > 0);
  const ingresos = kpis.ingresos_usd || 0;
  const egresosParaMargen = isFiltrado ? (kpis.egresos_directos || 0) : (kpis.egresos_usd || 0);
  const margen = ingresos > 0 ? round2(((ingresos - egresosParaMargen) / ingresos) * 100) : 0;

  // Datos de tendencia
  const flowQuery = `
    SELECT 
      DATE(a.fecha) as fecha_dia,
      SUM(a.debe_usd) as ingresos_usd,
      SUM(a.haber_usd) as egresos_usd
    FROM contabilidad_asientos a
    ${joinClause}
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY DATE(a.fecha)
    ORDER BY DATE(a.fecha) ASC
  `;
  const trend = db.prepare(flowQuery).all(...params).map(r => ({
    fecha: r.fecha_dia,
    ingresos_usd: round2(r.ingresos_usd || 0),
    egresos_usd: round2(r.egresos_usd || 0),
    ganancia_neta_usd: round2((r.ingresos_usd || 0) - (r.egresos_usd || 0))
  }));

  return {
    kpis: {
      ingresos_totales: round2(ingresos),
      egresos_totales: round2(kpis.egresos_usd || 0),
      ganancia_neta: round2(ingresos - (kpis.egresos_usd || 0)),
      margen_neto: margen,
      is_margen_contribucion: isFiltrado
    },
    trend
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
  getDashboardStats
};
