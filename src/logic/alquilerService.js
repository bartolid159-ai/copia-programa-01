import * as dbManager from '../db/manager.js';

export const registrarAlquiler = async (alquilerData) => {
  try {
    if (!alquilerData.nombre_arrendatario || !alquilerData.fecha || !alquilerData.turno || !alquilerData.precio_usd) {
      return { success: false, message: "Todos los campos son obligatorios." };
    }

    const precioNum = Number(alquilerData.precio_usd);
    if (precioNum <= 0) {
      return { success: false, message: "El precio del alquiler debe ser mayor a 0." };
    }

    const result = dbManager.insertAlquilerConsultorio({
      ...alquilerData,
      precio_usd: precioNum
    });

    return { 
      success: true, 
      message: "Alquiler registrado exitosamente.", 
      id: result.lastInsertRowid 
    };
  } catch (error) {
    console.error("Error en registrarAlquiler:", error);
    return { success: false, message: "Error al registrar el alquiler." };
  }
};

export const getAlquileres = async () => {
  try {
    return dbManager.getAllAlquileres();
  } catch (error) {
    console.error("Error en getAlquileres:", error);
    return [];
  }
};

export const eliminarAlquiler = async (id) => {
  try {
    dbManager.deleteAlquiler(id);
    return { success: true, message: "Alquiler eliminado exitosamente." };
  } catch (error) {
    console.error("Error en eliminarAlquiler:", error);
    return { success: false, message: "Error al eliminar el alquiler." };
  }
};
