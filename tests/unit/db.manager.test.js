/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, closeDb, processInvoice, getFacturaById, getFacturaDetalles, getAllFacturas } from '../../src/db/manager.js';
import { insertPaciente, insertMedico, insertServicio, insertInsumo, setServicioInsumos, insertCategoria, insertAlquilerConsultorio, getAllAlquileres } from '../../src/db/manager.js';

describe('processInvoice - Persistencia ACID', () => {
  beforeEach(() => {
    closeDb();
    const db = getDb(':memory:'); // Force memory for clean tests
    
    // Check if some core tables exist
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    const tableNames = tables.map(t => t.name);
    if (!tableNames.includes('pacientes')) {
       throw new Error("Critical: 'pacientes' table not found in memory DB. Schema loading failed.");
    }
  });

  const setupTestData = async () => {
    const db = getDb();
    
    insertPaciente({
      cedula_rif: 'V12345678',
      nombre: 'Juan Pérez',
      sexo: 'M',
      edad: 30,
      telefono: '04121234567',
      correo: 'juan@test.com',
      direccion: 'Caracas'
    });

    insertMedico({
      nombre: 'Dr. House',
      cedula_rif: 'V98765432',
      telefono: '04149876543',
      correo: 'house@test.com',
      especialidad: 'Medicina General'
    });

    insertServicio({
      nombre: 'Consulta General',
      precio_usd: 30,
      es_exento: 1,
      id_medico_defecto: 1
    });

    insertCategoria('Material Médico');

    insertInsumo({
      codigo: 'G-001',
      nombre: 'Guantes de Látex',
      descripcion: 'Guantes estériles talla M',
      id_categoria: 1,
      stock_actual: 100,
      stock_minimo: 10,
      unidad_medida: 'Par',
      costo_unitario_usd: 0.50
    });

    setServicioInsumos(1, [{ id_insumo: 1, cantidad: 2 }]);
  };

  it('debe crear una factura con transacción ACID', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: {
        subtotal_usd: 30,
        iva_usd: 0,
        total_usd: 30,
        total_ves: 1080
      },
      commission: 3,
      requiredInsumos: [{ id_insumo: 1, cantidad_total: 2 }]
    };

    const result = processInvoice(invoiceData);

    expect(result.success).toBe(true);
    expect(result.facturaId).toBe(1);
  });

  it('debe reducir el stock de insumos al procesar factura', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: { subtotal_usd: 30, iva_usd: 0, total_usd: 30, total_ves: 1080 },
      commission: 3,
      requiredInsumos: [{ id_insumo: 1, cantidad_total: 2 }]
    };

    processInvoice(invoiceData);

    const db = getDb();
    const insumo = db.prepare('SELECT stock_actual FROM insumos WHERE id = 1').get();
    expect(insumo.stock_actual).toBe(98);
  });

  it('debe crear asientos contables de ingreso únicamente (comisión se registra al liquidar)', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: { subtotal_usd: 30, iva_usd: 0, total_usd: 30, total_ves: 1080 },
      commission: 3,
      requiredInsumos: []
    };

    processInvoice(invoiceData);

    const db = getDb();
    const asientos = db.prepare('SELECT * FROM contabilidad_asientos ORDER BY id').all();
    
    expect(asientos.length).toBe(2); // Ingreso + Comisión Médica
    expect(asientos[0].tipo).toBe('INGRESO');
    expect(asientos[0].debe_usd).toBe(30);
    expect(asientos[1].tipo).toBe('EGRESO');
    expect(asientos[1].categoria).toBe('COMISION');
  });

  it('debe calcular IVA para servicios no exentos', async () => {
    closeDb();
    getDb(':memory:');
    
    insertPaciente({
      cedula_rif: 'V12345678',
      nombre: 'Juan Pérez',
      sexo: 'M',
      edad: 30,
      telefono: '04121234567',
      correo: 'juan@test.com',
      direccion: 'Caracas'
    });

    insertMedico({
      nombre: 'Dr. House',
      cedula_rif: 'V98765432',
      telefono: '04149876543',
      correo: 'house@test.com',
      especialidad: 'Medicina General'
    });

    insertServicio({
      nombre: 'Electrocardiograma',
      precio_usd: 50,
      es_exento: 0,
      id_medico_defecto: 1
    });

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 50, es_exento: false }
      ],
      totals: { subtotal_usd: 50, iva_usd: 8, total_usd: 58, total_ves: 2088 },
      commission: 5.8,
      requiredInsumos: []
    };

    const result = processInvoice(invoiceData);
    expect(result.success).toBe(true);

    const detalles = getFacturaDetalles(result.facturaId);
    expect(detalles[0].iva_porcentaje).toBe(16);
    expect(detalles[0].precio_unitario_usd).toBe(50);
  });

  it('debe guardar y recuperar el método de pago y detalle de la factura', () => {
    // Insertar datos necesarios para FK
    const p = insertPaciente({
      cedula_rif: 'V-PAY-TEST', nombre: 'Test Pago', sexo: 'M',
      edad: 30, telefono: '123', correo: 'a@a.com', direccion: 'x'
    });
    const m = insertMedico({
      nombre: 'Dr. Pago', cedula_rif: 'V-DOC-PAY', telefono: '456',
      correo: 'd@d.com', especialidad: 'X'
    });
    const s = insertServicio({
      nombre: 'Svc Pago', precio_usd: 100, es_exento: 1, id_medico_defecto: m.lastInsertRowid
    });

    const invoiceData = {
      id_paciente: p.lastInsertRowid,
      id_medico: m.lastInsertRowid,
      tasa_cambio: 36,
      items: [{ id_servicio: s.lastInsertRowid, cantidad: 1, precio_usd: 100, es_exento: true }],
      totals: { subtotal_usd: 100, iva_usd: 0, total_usd: 100, total_ves: 3600 },
      commission: 10,
      requiredInsumos: [],
      metodo_pago: 'TRANSFERENCIA',
      detalle_pago: '9999'
    };

    const result = processInvoice(invoiceData);
    expect(result.success).toBe(true);

    const facturas = getAllFacturas();
    const guardada = facturas.find(f => f.id === result.facturaId);
    
    expect(guardada.metodo_pago).toBe('TRANSFERENCIA');
    expect(guardada.detalle_pago).toBe('9999');
  });

  it('debe usar EFECTIVO_USD por defecto si no se especifica el método', () => {
    const p = insertPaciente({
      cedula_rif: 'V-DEF-TEST', nombre: 'Test Default', sexo: 'M',
      edad: 30, telefono: '123', correo: 'b@b.com', direccion: 'x'
    });
    
    const m = insertMedico({
      nombre: 'Dr. Default', cedula_rif: 'V-DOC-DEF', telefono: '456',
      correo: 'e@e.com', especialidad: 'X'
    });
    
    const invoiceData = {
      id_paciente: p.lastInsertRowid,
      id_medico: m.lastInsertRowid,
      tasa_cambio: 36,
      items: [],
      totals: { subtotal_usd: 0, iva_usd: 0, total_usd: 0, total_ves: 0 },
      commission: 0,
      requiredInsumos: []
    };
    
    console.log('Test IDs:', { paciente: p.lastInsertRowid, medico: m.lastInsertRowid });
    const result = processInvoice(invoiceData);
    const facturas = getAllFacturas();
    const guardada = facturas.find(f => f.id === (result.facturaId || result.id_factura));
    
    expect(guardada.metodo_pago).toBe('EFECTIVO_USD');
  });

  it('debe registrar gasto extra de servicio y reflejarlo en contabilidad', async () => {
    const p = insertPaciente({
      cedula_rif: 'V-GASTO-01', nombre: 'Paciente Gasto', sexo: 'M',
      edad: 30, telefono: '04120000000',
      correo: 'gasto@test.com', direccion: 'Caracas'
    });

    const m = insertMedico({
      nombre: 'Dr. Gasto', cedula_rif: 'V-MED-GASTO', telefono: '04140000000',
      correo: 'dr.gasto@test.com', especialidad: 'Test'
    });

    insertCategoria('Material Médico');
    insertInsumo({
      codigo: 'G-002', nombre: 'Guantes Test', descripcion: 'Para gasto test',
      id_categoria: 1, stock_actual: 100, stock_minimo: 10,
      unidad_medida: 'Par', costo_unitario_usd: 0.50
    });

    const s = insertServicio({
      nombre: 'Servicio con Gasto', precio_usd: 20, es_exento: 1,
      id_medico_defecto: m.lastInsertRowid,
      gasto_descripcion: 'Gasto operativo test', gasto_precio_usd: 5
    });

    setServicioInsumos(s.lastInsertRowid, [{ id_insumo: 1, cantidad: 2 }]);

    const invoiceData = {
      id_paciente: p.lastInsertRowid, id_medico: m.lastInsertRowid, tasa_cambio: 36,
      items: [{ id_servicio: s.lastInsertRowid, cantidad: 1, precio_usd: 20, es_exento: true }],
      totals: { subtotal_usd: 20, iva_usd: 0, total_usd: 20, total_ves: 720 },
      commission: 2, requiredInsumos: [{ id_insumo: 1, cantidad_total: 2 }]
    };

    console.log('Gasto Test IDs:', { p: p.lastInsertRowid, m: m.lastInsertRowid, s: s.lastInsertRowid });
    const result = processInvoice(invoiceData);
    expect(result.success).toBe(true);

    const db = getDb();
    const asientos = db.prepare('SELECT * FROM contabilidad_asientos ORDER BY id').all();

    // 1 Ingreso, 1 Egreso Insumo, 1 Egreso Gasto Extra, 1 Comisión
    expect(asientos.length).toBe(4);

    const ingreso = asientos.find(a => a.tipo === 'INGRESO');
    expect(ingreso.debe_usd).toBe(20);

    const egresoInsumo = asientos.find(a => a.categoria === 'COSTO_INSUMO');
    expect(egresoInsumo.haber_usd).toBe(1);

    const egresoGasto = asientos.find(a => a.categoria === 'GASTO_EXTRA_SERVICIO');
    expect(egresoGasto).toBeDefined();
    expect(egresoGasto.haber_usd).toBe(5);

    const totalIngresos = asientos.filter(a => a.tipo === 'INGRESO').reduce((sum, a) => sum + a.debe_usd, 0);
    const totalEgresos = asientos.filter(a => a.tipo === 'EGRESO').reduce((sum, a) => sum + a.haber_usd, 0);
    expect(totalIngresos).toBe(20);
    expect(totalEgresos).toBe(8); // 1 (insumo) + 5 (gasto) + 2 (comision)
    expect(totalIngresos - totalEgresos).toBe(12);
    });

  it('debe registrar un alquiler de consultorio y generar el asiento contable de ingreso', () => {
    const data = {
      nombre_arrendatario: 'Dr. Externo',
      consultorio: 'Consultorio 2',
      fecha: '2026-05-10',
      turno: 'TARDE',
      precio_usd: 25.0,
      metodo_pago: 'EFECTIVO_USD'
    };

    const result = insertAlquilerConsultorio(data);
    expect(result.lastInsertRowid).toBeDefined();

    // Verificar que se creó el registro en la tabla de alquileres
    const alquileres = getAllAlquileres();
    const found = alquileres.find(a => a.id === result.lastInsertRowid);
    expect(found).toBeDefined();
    expect(found.nombre_arrendatario).toBe('Dr. Externo');
    expect(found.consultorio).toBe('Consultorio 2');

    // Verificar que se creó el asiento contable
    const db = getDb();
    const asiento = db.prepare("SELECT * FROM contabilidad_asientos WHERE categoria = 'ALQUILER_CONSULTORIO' AND referencia_id = ?").get(result.lastInsertRowid);
    expect(asiento).toBeDefined();
    expect(asiento.tipo).toBe('INGRESO');
    expect(asiento.debe_usd).toBe(25.0);
    expect(asiento.descripcion).toContain('Consultorio 2');
    expect(asiento.descripcion).toContain('Dr. Externo');
  });
});
