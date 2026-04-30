import Database from 'better-sqlite3';
import path from 'path';

let db;
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Nombres de las tablas y claves de localStorage
const INVOICES_KEY = 'clinica_facturas';
const PATIENTS_KEY = 'clinica_pacientes';
const SERVICES_KEY = 'clinica_servicios';
const DOCTORS_KEY = 'clinica_medicos';

export const getDb = (dbPath = 'clinica.db') => {
  if (isBrowser) return null;
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
};

export const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

/**
 * Módulo de Médicos
 */
export const getAllDoctors = () => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
  }
  const db = getDb();
  return db.prepare('SELECT * FROM medicos').all();
};

/**
 * Módulo de Servicios
 */
export const getAllServices = () => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
  }
  const db = getDb();
  return db.prepare('SELECT * FROM servicios').all();
};

/**
 * Módulo de Facturación
 */
export const getFacturaById = (id) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const invoice = invoices.find(f => f.id === id);
    if (!invoice) return null;
    
    // Simular joins con pacientes y medicos en browser
    const patients = JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]');
    const doctors = getAllDoctors();
    const patient = patients.find(p => p.id === invoice.id_paciente);
    const doctor = doctors.find(d => d.id === invoice.id_medico);
    
    return {
      ...invoice,
      paciente_nombre: patient ? patient.nombre : '—',
      medico_nombre: doctor ? doctor.nombre : '—'
    };
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT f.*, p.nombre AS paciente_nombre, m.nombre AS medico_nombre
    FROM facturas f
    LEFT JOIN pacientes p ON f.id_paciente = p.id
    LEFT JOIN medicos m ON f.id_medico = m.id
    WHERE f.id = ?
  `);
  return stmt.get(id);
};

export const getFacturaDetalles = (id_factura) => {
  if (isBrowser) {
    const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    const invoice = invoices.find(f => f.id === id_factura);
    if (!invoice || !invoice.items) return [];
    
    // En el modo browser guardamos los items dentro de la factura
    // para simplificar el localStorage. Los mapeamos al formato de tabla.
    const services = getAllServices();
    return invoice.items.map(item => {
      const srv = services.find(s => s.id === item.id_servicio);
      return {
        ...item,
        servicio_nombre: srv ? srv.nombre : 'Servicio Desconocido'
      };
    });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT fd.*, s.nombre AS servicio_nombre
    FROM factura_detalles fd
    JOIN servicios s ON fd.id_servicio = s.id
    WHERE fd.id_factura = ?
  `);
  return stmt.all(id_factura);
};

export const deleteAsientoManual = (id) => {
  if (isBrowser) {
    const list = JSON.parse(localStorage.getItem('clinica_asientos_manuales') || '[]');
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem('clinica_asientos_manuales', JSON.stringify(filtered));
    return { success: true };
  }
  const db = getDb();
  // Solo permitimos borrar EGRESOS para evitar corrupcion de facturacion
  const result = db.prepare("DELETE FROM contabilidad_asientos WHERE id = ? AND tipo = 'EGRESO'").run(id);
  return { success: result.changes > 0 };
};

export const deleteCompra = (id) => {
  if (isBrowser) {
    const compras = JSON.parse(localStorage.getItem('clinica_compras') || '[]');
    const detalles = JSON.parse(localStorage.getItem('clinica_compra_detalles') || '[]');
    
    localStorage.setItem('clinica_compras', JSON.stringify(compras.filter(c => c.id !== id)));
    localStorage.setItem('clinica_compra_detalles', JSON.stringify(detalles.filter(d => d.id_compra !== id)));
    return { success: true };
  }
  const db = getDb();
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM compra_detalles WHERE id_compra = ?").run(id);
      db.prepare("DELETE FROM compras WHERE id = ?").run(id);
    })();
    return { success: true };
  } catch (err) {
    console.error("Error al borrar compra:", err);
    return { success: false, error: err.message };
  }
};
