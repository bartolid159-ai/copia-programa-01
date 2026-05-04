
import { getDb, closeDb, insertPaciente, insertMedico, insertServicio, insertInsumo, setServicioInsumos, registrarCompra, processInvoice, registrarTasa } from './src/db/manager.js';
import { getDashboardStats } from './src/logic/reportService.js';

async function verify() {
  const db = getDb(':memory:');
  
  // Setup
  insertPaciente({
    cedula_rif: 'V-1', nombre: 'Test', sexo: 'M', edad: 20, telefono: '1', correo: 'a@a.com', direccion: 'x'
  });
  const mId = insertMedico({
    nombre: 'Dr. Test', cedula_rif: 'M-1', telefono: '1', correo: 'm@m.com', especialidad: 'X', porcentaje_comision: 10
  }).lastInsertRowid;
  
  const iId = insertInsumo({
    codigo: 'I-1', nombre: 'Insumo 1', descripcion: 'X', id_categoria: null, stock_actual: 0, stock_minimo: 1, unidad_medida: 'U', costo_unitario_usd: 1
  }).lastInsertRowid;
  
  registrarCompra({
    proveedor: 'Prov', items: [{ id_insumo: iId, cantidad: 10, costo_unitario_usd: 1 }]
  });
  
  const sId = insertServicio({
    nombre: 'Svc', precio_usd: 100, es_exento: 1, id_medico_defecto: mId, gasto_descripcion: 'Extra', gasto_precio_usd: 5
  }).lastInsertRowid;
  
  setServicioInsumos(sId, [{ id_insumo: iId, cantidad: 1 }]);
  
  const tasa = 36;
  registrarTasa(new Date().toISOString().split('T')[0], tasa);
  
  // Process Invoice
  const invoiceData = {
    id_paciente: 1,
    id_medico: mId,
    tasa_cambio: tasa,
    items: [{ id_servicio: sId, cantidad: 1, precio_usd: 100, es_exento: true }],
    totals: { subtotal_usd: 100, iva_usd: 0, total_usd: 100, total_ves: 3600 },
    commission: 10,
    requiredInsumos: [{ id_insumo: iId, cantidad_total: 1 }]
  };
  
  processInvoice(invoiceData);
  
  // Check Stats
  const stats = getDashboardStats();
  console.log('--- KPI Globales ---');
  console.log(JSON.stringify(stats.kpis.globales, null, 2));
  console.log('--- KPI Operativos ---');
  console.log(JSON.stringify(stats.kpis.operativos, null, 2));
  
  closeDb();
}

verify();
