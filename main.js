const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración de Logging para actualizaciones
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Importar el servidor Express existente
// NOTA: Aseguramos que el servidor se inicie solo una vez
let server;
try {
  // Redirigir console.log para depuración
  const serverPath = path.join(__dirname, 'server.js');
  console.log('Iniciando servidor desde:', serverPath);
  require(serverPath);
} catch (e) {
  console.error('Error al iniciar el servidor Express:', e);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Zion Presenter",
    icon: path.join(__dirname, 'img/favicon.png'), // Asegúrate de tener un icono aquí o usa .icns/.ico para build
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Permitir require en renderer si es necesario (cuidado con seguridad)
      // O idealmente usar preload script
    },
    show: false // No mostrar hasta que esté listo para evitar pantalla blanca
  });

  // Cargar la URL del servidor local
  // El servidor en server.js está configurado para escuchar en puerto 3000 por defecto
  // Esperamos un poco para asegurar que el servidor esté arriba
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1500);

  // Maximizar al iniciar
  mainWindow.maximize();
  mainWindow.show();

  // Manejar el visor (Overlay) como ventana independiente de Electron
  app.on('browser-window-created', (e, window) => {
    // Si la ventana que se está creando es el Visor (lo detectamos por el título o la URL si es posible)
    // Pero es mejor usar setWindowOpenHandler para configurarlo
  });

  // Abrir enlaces externos en el navegador predeterminado y manejar el visor
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Si es el visor (ya sea por nombre de archivo o la ruta /v/)
    if (url.includes('cantos_overlay.html') || url.includes('/v/')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          title: "Zion Presenter - Visor",
          autoHideMenuBar: true,
          backgroundColor: '#000000',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }

    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Escuchar cuando se crean CUALQUIER ventana nueva para aplicar el truco del FullScreen
  app.on('browser-window-created', (event, newWindow) => {
    newWindow.webContents.on('did-finish-load', () => {
      const url = newWindow.webContents.getURL();
      if (url.includes('cantos_overlay.html') || url.includes('/v/')) {
        // Truco: Cuando el usuario presione el botón de maximizar (o doble clic en barra)
        // se dispara el modo pantalla completa real.
        newWindow.on('maximize', () => {
          newWindow.setFullScreen(true);
        });
      }
    });
  });

  // Comprobar actualizaciones al iniciar
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Eventos de AutoUpdater
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización Disponible',
    message: 'Una nueva versión de Zion Presenter está disponible. Se descargará en segundo plano.'
  });
});
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
  log.info('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
});
autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Reiniciar e Instalar', 'Más tarde'],
    title: 'Actualización Lista',
    message: 'La nueva versión se ha descargado. ¿Quieres reiniciar la aplicación ahora para instalarla?'
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
