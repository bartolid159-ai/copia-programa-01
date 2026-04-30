import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dbManager from '../src/db/manager';
import * as reportService from '../src/logic/reportService';
import * as billingEngine from '../src/logic/billingEngine';

interface InvoiceTotals {
  subtotal_usd: number;
  iva_usd: number;
  total_usd: number;
  total_ves: number;
  exchangeRate: number;
}

interface StockAlerta {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

interface TopServicio {
  nombre: string;
  ingresos_usd: number;
  ganancia_neta_usd: number;
}

describe('Simulacro de Módulo de Contabilidad (QA E2E Logic)', () => {
  let db;

  beforeAll(() => {
    // Usamos base de datos en memoria para el simulacro
    db = dbManager.getDb(':memory:');
  });

  afterAll(() => {
    dbManager.closeDb();
  });

  it('debe registrar correctamente el flujo de un día típico y reflejarlo en el Dashboard', () => {
    // 1. Fase A: Preparación del Terreno
    
    // Crear Médico
    const medicoId = dbManager.insertMedico({
      nombre: 'Dr. Simulacro QA',
      cedula_rif: 'M-123456',
      telefono: '0412-0000000',
      correo: 'dr@qa.com',
      especialidad: 'General',
      porcentaje_comision: 20
    }).lastInsertRowid;

    // Crear Paciente
    const pacienteId = dbManager.insertPaciente({
      cedula_rif: 'V-102030',
      nombre: 'Carlos Prueba',
      sexo: 'M',
      fecha_nacimiento: '1990-01-01',
      telefono: '0424-9999999',
      correo: 'carlos@prueba.com',
      direccion: 'Ciudad QA'
    }).lastInsertRowid;

    // Crear Insumo (Gasas QA)
    const insumoId = dbManager.insertInsumo({
      codigo: 'GS-QA',
      nombre: 'Gasas QA',
      descripcion: 'Gasas para cirugía',
      id_categoria: null,
      stock_actual: 0,
      stock_minimo: 10,
      unidad_medida: 'Paquete',
      costo_unitario_usd: 5
    }).lastInsertRowid;

    // Comprar Insumo (Llenar lote FIFO)
    dbManager.registrarCompra({
      proveedor: 'Proveedor QA',
      items: [{ id_insumo: insumoId, cantidad: 12, costo_unitario_usd: 5 }]
    });

    // Crear Servicio vinculado
    const servicioId = dbManager.insertServicio({
      nombre: 'Consulta General QA',
      precio_usd: 50,
      es_exento: 1,
      id_medico_defecto: medicoId,
      gasto_descripcion: null,
      gasto_precio_usd: 0
    }).lastInsertRowid;

    dbManager.setServicioInsumos(servicioId, [{ id_insumo: insumoId, cantidad: 1 }]);

    // 2. Fase B: Operaciones (Facturación)
    const tasa = 35.5; // Tasa ficticia
    dbManager.registrarTasa(new Date().toISOString().split('T')[0], tasa);

    // Factura 1: USD Cash
    const items1 = [{ id_servicio: servicioId, nombre: 'Consulta', cantidad: 1, precio_usd: 50, es_exento: true }];
    const totals1 = billingEngine.calculateTotals(items1, tasa) as InvoiceTotals;
    const comm1 = billingEngine.calculateCommission(totals1.total_usd, 20);
    const reqInsumos1 = billingEngine.getRequiredInsumos(items1, { [servicioId]: [{ id_insumo: insumoId, cantidad: 1 }] });

    dbManager.processInvoice({
      id_paciente: pacienteId,
      id_medico: medicoId,
      tasa_cambio: tasa,
      items: items1,
      totals: totals1,
      commission: comm1,
      requiredInsumos: reqInsumos1,
      metodo_pago: 'EFECTIVO_USD'
    });

    // Factura 2: VES Transfer
    const items2 = [{ id_servicio: servicioId, nombre: 'Consulta', cantidad: 1, precio_usd: 50, es_exento: true }];
    const totals2 = billingEngine.calculateTotals(items2, tasa) as InvoiceTotals;
    const comm2 = billingEngine.calculateCommission(totals2.total_usd, 20);
    const reqInsumos2 = billingEngine.getRequiredInsumos(items2, { [servicioId]: [{ id_insumo: insumoId, cantidad: 1 }] });

    dbManager.processInvoice({
      id_paciente: pacienteId,
      id_medico: medicoId,
      tasa_cambio: tasa,
      items: items2,
      totals: totals2,
      commission: comm2,
      requiredInsumos: reqInsumos2,
      metodo_pago: 'PAGO_MOVIL_VES'
    });

    // 3. Fase C: Verificación en Dashboard (Report Service)
    const kpis = reportService.getKpiDia();
    
    // Ingresos totales = 50 + 50 = 100 USD
    expect(kpis.ingresos.usd).toBe(100);
    // Ingresos VES = 100 * 35.5 = 3550
    expect(kpis.ingresos.ves).toBe(3550);

    // Egresos (Compra Inventario: 12 unidades * 5 USD = 60 USD)
    // Nota: Las comisiones no se restan aquí porque no se ha realizado la liquidación todavía.
    expect(kpis.egresos.usd).toBe(60);

    // Ganancia Neta: 100 (Ingresos) - 60 (Compra Inventario) = 40 USD
    expect(kpis.ganancia_neta.usd).toBe(40);

    // Alertas de Stock: Stock inicial 12, usado 2. Quedan 10. Stock Min es 10. Debe salir en alertas (stock_actual <= stock_minimo)
    const alertas = reportService.getStockAlertas() as StockAlerta[];
    const alertaGasas = alertas.find((a: StockAlerta) => a.id === insumoId);
    expect(alertaGasas).toBeDefined();
    expect(alertaGasas?.stock_actual).toBe(10);

    // Top Servicios (Pareto)
    const tops = reportService.getTopServicios() as TopServicio[];
    const topServ = tops.find((s: TopServicio) => s.nombre === 'Consulta General QA');
    expect(topServ).toBeDefined();
    expect(topServ?.ingresos_usd).toBe(100);
    // Ganancia por servicio: El modelo actual descuenta COSTO_INSUMO (10 USD) y COMISION_MEDICO (20% de 100 = 20 USD).
    // Ganancia neta real = 100 - 10 - 20 = 70 USD.
    expect(topServ?.ganancia_neta_usd).toBe(70);
  });
});
