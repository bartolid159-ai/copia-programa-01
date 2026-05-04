const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../build/icon.ico'),
    show: false
  });

  // Load the built React app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Backup on close
  mainWindow.on('close', async (e) => {
    const { dialog } = require('electron');
    
    // Prevent default close to show dialog
    e.preventDefault();

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Sí, respaldar', 'No, salir', 'Cancelar'],
      defaultId: 0,
      title: 'Confirmar salida',
      message: '¿Desea crear una copia de seguridad de la base de datos antes de salir?',
      detail: 'Se guardará una copia exacta de todos sus datos contables.'
    });

    if (result.response === 0) {
      // Sí, respaldar
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'data.sqlite');
      const date = new Date().toISOString().split('T')[0];
      
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar Respaldo',
        defaultPath: path.join(app.getPath('desktop'), `Respaldo_Clinica_${date}.sqlite`),
        filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
      });

      if (!saveResult.canceled && saveResult.filePath) {
        try {
          fs.copyFileSync(dbPath, saveResult.filePath);
          app.exit(0);
        } catch (err) {
          await dialog.showErrorBox('Error al respaldar', 'No se pudo guardar el archivo: ' + err.message);
          app.exit(0);
        }
      }
    } else if (result.response === 1) {
      // No, salir sin respaldar
      app.exit(0);
    }
    // Si es 2 (Cancelar), no hacemos nada y la ventana se queda abierta
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for secure communication
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle database path
ipcMain.handle('get-db-path', () => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'data.sqlite');
  
  // Ensure the directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  return dbPath;
});