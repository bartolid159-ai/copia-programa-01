/**
 * Billing Engine - Motor de Cálculo para Facturación
 * Maneja cálculos financieros con precisión decimal estricto
 */

const IVA_RATE = 0.16;

/**
 * Redondea a 2 decimales para evitar errores de punto flotante
 */
const round2 = (num) => Math.round(num * 100) / 100;

/**
 * Calcula los totales de una factura
 * @param {Array} items - Array de {id_servicio, nombre, cantidad, precio_usd, es_exento}
 * @param {number} exchangeRate - Tasa de cambio USD -> VES
 * @returns {Object} { subtotal_usd, iva_usd, total_usd, total_ves }
 */
export const calculateTotals = (items, exchangeRate) => {
  if (!items || items.length === 0) {
    return { subtotal_usd: 0, iva_usd: 0, total_usd: 0, total_ves: 0 };
  }

  const exchangeRateVal = Number(exchangeRate) || 0;
  
  let subtotal_usd = 0;
  let iva_usd = 0;

  for (const item of items) {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precio_usd) || 0;
    
    // El IVA ahora es 0% por defecto. 
    // Solo aplica si 'aplica_iva' es true O si 'es_exento' es explícitamente false.
    const aplicaIva = item.aplica_iva === true || item.aplica_iva === 1 || item.es_exento === false || item.es_exento === 0;

    const lineaTotal = round2(cantidad * precio);
    subtotal_usd = round2(subtotal_usd + lineaTotal);

    if (aplicaIva) {
      const lineaIva = round2(lineaTotal * IVA_RATE);
      iva_usd = round2(iva_usd + lineaIva);
    }
  }

  const total_usd = round2(subtotal_usd + iva_usd);
  const total_ves = round2(total_usd * exchangeRateVal);

  return {
    subtotal_usd,
    iva_usd,
    total_usd,
    total_ves,
    exchangeRate: exchangeRateVal
  };
};

/**
 * Calcula la sumatoria de comisiones basada en los servicios
 * @param {Array} items - Array de {id_servicio, precio_usd, cantidad, porcentaje_comision}
 * @returns {number} Monto total de comisión en USD
 */
export const calculateCommission = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  
  const totalCommission = items.reduce((acc, item) => {
    const precio = Number(item.precio_usd) || 0;
    const cantidad = Number(item.cantidad) || 0;
    const porcentaje = Number(item.porcentaje_comision) || 0;
    return acc + (precio * cantidad * (porcentaje / 100));
  }, 0);

  return round2(totalCommission);
};

/**
 * Consolida los insumos necesarios para una lista de items de factura
 * @param {Array} items - Array de items de factura
 * @param {Object} serviciosInsumos - Map de {id_servicio: [{id_insumo, cantidad}]}
 * @returns {Array} Array consolidado de {id_insumo, cantidad_total}
 */
export const getRequiredInsumos = (items, serviciosInsumos = {}) => {
  const consolidado = {};

  for (const item of items) {
    const idServicio = Number(item.id_servicio);
    const cantidad = Number(item.cantidad) || 0;
    const insumosDelServicio = serviciosInsumos[idServicio];

    if (insumosDelServicio && Array.isArray(insumosDelServicio)) {
      for (const insumo of insumosDelServicio) {
        const idInsumo = Number(insumo.id_insumo);
        if (!consolidado[idInsumo]) {
          consolidado[idInsumo] = 0;
        }
        consolidado[idInsumo] = round2(consolidado[idInsumo] + (insumo.cantidad * cantidad));
      }
    }
  }

  return Object.entries(consolidado).map(([id_insumo, cantidad_total]) => ({
    id_insumo: Number(id_insumo),
    cantidad_total
  }));
};

export default {
  calculateTotals,
  calculateCommission,
  getRequiredInsumos
};
