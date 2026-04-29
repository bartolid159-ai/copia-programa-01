import { getDb } from './db/manager.js';

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

let bcrypt;
if (!isBrowser) {
  try {
    const req = typeof require !== 'undefined' ? require : (typeof process !== 'undefined' && process.mainModule ? process.mainModule.require : eval('require'));
    bcrypt = req('bcrypt');
  } catch (err) {
    console.warn("Bcrypt native no disponible.");
  }
}

export async function login(username, password) {
  if (isBrowser) {
    // Modo Navegador (Desarrollo): Soporte para clave 'admin' por defecto
    if (username === 'admin' && (password === 'admin' || password === '1234')) {
      return { success: true, user: { id: 1, username: 'admin' } };
    }
    return { success: false, message: 'Credenciales inválidas en modo navegador.' };
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }
  
  if (!bcrypt) {
    return { success: false, message: 'Motor de seguridad no inicializado' };
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return { success: true, user: { id: user.id, username: user.username } };
  } else {
    return { success: false, message: 'Contraseña incorrecta' };
  }
}

export async function register(username, password) {
  if (isBrowser) return { success: true };

  const db = getDb();
  if (!bcrypt) return { success: false, message: 'Motor de seguridad no inicializado' };
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'El usuario ya existe' };
  }
}