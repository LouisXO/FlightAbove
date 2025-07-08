import { app, BrowserWindow, Menu, MenuItem, shell, ipcMain } from 'electron';
import { menubar } from 'menubar';
import path from 'path';
import { isDev } from './utils';
import { FlightService } from './services/FlightService';
import { LocationService } from './services/LocationService';

// Keep a global reference of the window object
let mb: any = null;

// Initialize services
const flightService = FlightService.getInstance();
const locationService = LocationService.getInstance();

// Set up IPC handlers
ipcMain.handle('get-flight-data', async () => {
  try {
    const location = await locationService.getCurrentLocation();
    return await flightService.getFlightData(location);
  } catch (error) {
    console.error('Error getting flight data:', error);
    return null;
  }
});

ipcMain.handle('get-current-location', async () => {
  try {
    return await locationService.getCurrentLocation();
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
});

ipcMain.handle('get-settings', async () => {
  // TODO: Implement settings storage
  return {
    updateInterval: 60000, // 1 minute
    radius: 50, // km
    showNotifications: true
  };
});

ipcMain.handle('set-settings', async (event, settings) => {
  // TODO: Implement settings storage
  console.log('Settings updated:', settings);
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

const createMenuBar = () => {
  mb = menubar({
    index: isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../renderer/index.html')}`,
    icon: path.join(__dirname, '../../assets/icon.png'),
    tooltip: 'FlightAbove - Current flights overhead',
    browserWindow: {
      width: 350,
      height: 200,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true
    },
    preloadWindow: true,
    showOnAllWorkspaces: true
  });

  mb.on('ready', () => {
    console.log('FlightAbove is ready!');
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Settings',
        click: () => {
          // TODO: Open settings window
          console.log('Settings clicked');
        }
      },
      {
        label: 'Refresh',
        click: () => {
          mb.window?.webContents.reload();
        }
      },
      { type: 'separator' },
      {
        label: 'About FlightAbove',
        click: () => {
          shell.openExternal('https://github.com/yourusername/flightabove');
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    mb.tray.on('right-click', () => {
      mb.tray.popUpContextMenu(contextMenu);
    });
  });

  mb.on('create-window', () => {
    mb.window?.on('closed', () => {
      mb.window = null;
    });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createMenuBar();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  // This is typical behavior for menu bar apps
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMenuBar();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mb && mb.window) {
      if (mb.window.isMinimized()) mb.window.restore();
      mb.window.focus();
    }
  });
} 