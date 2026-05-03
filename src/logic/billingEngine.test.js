import { describe, it, expect, beforeEach } from 'vitest';
import { calculateTotals, calculateCommission, getRequiredInsumos } from '../logic/billingEngine.js';

describe('billingEngine', () => {
  describe('calculateTotals', () => {
    it('debe retornar ceros para items vacíos', () => {
      const result = calculateTotals([], 36);
      expect(result.subtotal_usd).toBe(0);
      expect(result.iva_usd).toBe(0);
      expect(result.total_usd).toBe(0);
      expect(result.total_ves).toBe(0);
    });

    it('debe calcular correctamente para un servicio exento', () => {
      const items = [{ id_servicio: 1, nombre: 'Consulta', cantidad: 1, precio_usd: 30, es_exento: true }];
      const result = calculateTotals(items, 36);
      expect(result.subtotal_usd).toBe(30);
      expect(result.iva_usd).toBe(0);
      expect(result.total_usd).toBe(30);
      expect(result.total_ves).toBe(1080);
    });

    it('debe calcular IVA para servicios no exentos', () => {
      const items = [{ id_servicio: 1, nombre: 'Electro', cantidad: 1, precio_usd: 50, es_exento: false }];
      const result = calculateTotals(items, 36);
      expect(result.subtotal_usd).toBe(50);
      expect(result.iva_usd).toBe(8); // 50 * 0.16 = 8
      expect(result.total_usd).toBe(58);
    });

    it('debe manejar múltiples items con mixtos', () => {
      const items = [
        { id_servicio: 1, nombre: 'Consulta', cantidad: 2, precio_usd: 30, es_exento: true },
        { id_servicio: 2, nombre: 'Electro', cantidad: 1, precio_usd: 50, es_exento: false }
      ];
      const result = calculateTotals(items, 36);
      expect(result.subtotal_usd).toBe(110); // 60 + 50
      expect(result.iva_usd).toBe(8); // 50 * 0.16 = 8
      expect(result.total_usd).toBe(118);
    });

    it('debe manejar valores inválidos gracefully', () => {
      const items = [{ id_servicio: 1, nombre: 'Test', cantidad: null, precio_usd: 'a' }];
      const result = calculateTotals(items, 'invalid');
      expect(result.total_usd).toBe(0);
    });

    it('debe aplicar 0% IVA por defecto si no se especifica es_exento ni aplica_iva', () => {
      const items = [{ id_servicio: 1, nombre: 'Consulta', cantidad: 1, precio_usd: 100 }];
      const result = calculateTotals(items, 36);
      expect(result.iva_usd).toBe(0);
      expect(result.total_usd).toBe(100);
    });
  });

  describe('calculateCommission', () => {
    it('debe calcular comisión sumando items', () => {
      const items = [
        { precio_usd: 100, cantidad: 1, porcentaje_comision: 10 },
        { precio_usd: 50, cantidad: 2, porcentaje_comision: 20 }
      ];
      const commission = calculateCommission(items);
      expect(commission).toBe(30); // (100*1*0.1) + (50*2*0.2) = 10 + 20 = 30
    });

    it('debe retornar 0 para items vacíos o sin comisión', () => {
      expect(calculateCommission([])).toBe(0);
      expect(calculateCommission([{ precio_usd: 100, cantidad: 1 }])).toBe(0);
    });
  });

  describe('getRequiredInsumos', () => {
    it('debe consolidar insumos de múltiples servicios', () => {
      const items = [
        { id_servicio: 1, cantidad: 2 },
        { id_servicio: 2, cantidad: 1 }
      ];
      const serviciosInsumos = {
        1: [{ id_insumo: 1, cantidad: 2 }], // Consulta usa 2 guantes
        2: [{ id_insumo: 1, cantidad: 1 }, { id_insumo: 2, cantidad: 3 }] // Electro usa 1 guante + 3 jeringas
      };
      const result = getRequiredInsumos(items, serviciosInsumos);
      
      const guante = result.find(r => r.id_insumo === 1);
      const jeringa = result.find(r => r.id_insumo === 2);
      
      expect(guante.cantidad_total).toBe(5); // 2*2 + 1*1 = 5
      expect(jeringa.cantidad_total).toBe(3);
    });

    it('debe retornar array vacío si no hay insumos', () => {
      const items = [{ id_servicio: 1, cantidad: 1 }];
      const result = getRequiredInsumos(items, {});
      expect(result).toHaveLength(0);
    });
  });
});
