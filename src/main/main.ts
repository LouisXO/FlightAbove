import { app, BrowserWindow, Menu, MenuItem, shell, ipcMain, nativeImage } from 'electron';
import { menubar } from 'menubar';
import path from 'path';
import { isDev } from './utils';
import { FlightService, FlightData } from './services/FlightService';
import { LocationService } from './services/LocationService';
import { ApiKeyManager } from './services/ApiKeyManager';

// Keep a global reference of the window object
let mb: any = null;

// Initialize services
const flightService = FlightService.getInstance();
const locationService = LocationService.getInstance();
const apiKeyManager = ApiKeyManager.getInstance();

// Set up IPC handlers
ipcMain.handle('get-flight-data', async () => {
  try {
    const location = await locationService.getCurrentLocation();
    return await flightService.getFlightData(location);
  } catch (error) {
    console.error('Error getting flight data:', error);
    return [];
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
  const flightServiceSettings = flightService.getSettings();
  return {
    updateInterval: flightServiceSettings.refreshIntervalMinutes * 60 * 1000, // Convert to ms for backward compatibility
    radius: flightServiceSettings.radiusKm,
    showNotifications: true,
    ...flightServiceSettings
  };
});

ipcMain.handle('set-settings', async (event, settings) => {
  // Extract FlightService settings and update them
  const flightServiceSettings: any = {};
  
  if (settings.refreshIntervalMinutes !== undefined) {
    flightServiceSettings.refreshIntervalMinutes = settings.refreshIntervalMinutes;
  }
  if (settings.maxFlightsPerRequest !== undefined) {
    flightServiceSettings.maxFlightsPerRequest = settings.maxFlightsPerRequest;
  }
  if (settings.radiusKm !== undefined) {
    flightServiceSettings.radiusKm = settings.radiusKm;
  }
  if (settings.useFullEndpoint !== undefined) {
    flightServiceSettings.useFullEndpoint = settings.useFullEndpoint;
  }
  
  const demoModeChanged = settings.demoMode !== undefined;
  const demoModeEnabled = settings.demoMode === true;
  
  if (settings.demoMode !== undefined) {
    flightServiceSettings.demoMode = settings.demoMode;
  }
  
  flightService.updateSettings(flightServiceSettings);
  
  // Trigger immediate refresh when demo mode is enabled
  if (demoModeChanged && demoModeEnabled) {
    setTimeout(() => {
      updateMenuBarDisplay();
    }, 100);
  }
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// API Key Management IPC handlers
ipcMain.handle('set-flightradar24-api-key', async (event, apiKey: string) => {
  apiKeyManager.setFlightRadar24ApiKey(apiKey);
  return { success: true };
});

ipcMain.handle('get-flightradar24-api-key', async () => {
  return apiKeyManager.getFlightRadar24ApiKey();
});

ipcMain.handle('has-flightradar24-api-key', async () => {
  return apiKeyManager.hasFlightRadar24ApiKey();
});

ipcMain.handle('remove-flightradar24-api-key', async () => {
  apiKeyManager.removeFlightRadar24ApiKey();
  return { success: true };
});

ipcMain.handle('get-all-api-keys', async () => {
  return apiKeyManager.getAllApiKeys();
});

ipcMain.handle('get-airline-logo', async (event, airlineCode: string) => {
  return await apiKeyManager.getAirlineLogo(airlineCode);
});

// Credit usage tracking IPC handlers
ipcMain.handle('get-credit-usage-history', async () => {
  return flightService.getCreditUsageHistory();
});

ipcMain.handle('get-daily-credit-usage', async () => {
  return flightService.getDailyCreditUsage();
});

ipcMain.handle('get-hourly-credit-usage', async () => {
  return flightService.getHourlyCreditUsage();
});

ipcMain.handle('estimate-monthly-credits', async () => {
  return flightService.estimateMonthlyCredits();
});

// API Error handling IPC handlers
ipcMain.handle('get-last-api-error', async () => {
  return flightService.getLastApiError();
});

ipcMain.handle('clear-api-error', async () => {
  flightService.clearApiError();
});

// Demo Mode IPC handlers
ipcMain.handle('get-demo-mode', async () => {
  return flightService.getSettings().demoMode;
});

ipcMain.handle('set-demo-mode', async (event, enabled: boolean) => {
  flightService.updateSettings({ demoMode: enabled });
  
  // Trigger immediate refresh when demo mode is enabled
  if (enabled) {
    // Small delay to ensure settings are applied
    setTimeout(() => {
      updateMenuBarDisplay();
    }, 100);
  }
});

// Add refresh now handler
ipcMain.handle('refresh-now', async () => {
  console.log('Manual refresh triggered');
  updateMenuBarDisplay();
});

const updateMenuBarDisplay = async () => {
  try {
    if (mb && mb.tray) {
      mb.tray.setTitle('✈️ ...');
      mb.tray.setToolTip('FlightAbove - Searching for flights...');
    }
    
    const location = await locationService.getCurrentLocation();
    const flightData = await flightService.getFlightData(location);
    
    if (flightData && flightData.length > 0 && mb && mb.tray) {
      // Status icons for better visual feedback
      const statusIcons: { [key: string]: string } = {
        'On Time': '🟢',
        'Delayed': '🟡',
        'Cancelled': '🔴',
        'Unknown': '⚪'
      };
      
      // Show the closest flight in the menu bar
      const closestFlight = flightData[0];
      const statusIcon = statusIcons[closestFlight.status] || '⚪';
      
      // Clean display: Flight number + count if multiple (no airline icons)
      const displayText = flightData.length > 1 
        ? `${closestFlight.flightNumber}+${flightData.length - 1}`
        : `${closestFlight.flightNumber}`;
      
      // Rich tooltip with all details
      const tooltipLines = [
        `FlightAbove - ${flightData.length} flight${flightData.length > 1 ? 's' : ''} nearby`,
        '',
        `Closest: ${closestFlight.airline} Flight ${closestFlight.flightNumber}`,
        `${closestFlight.origin} → ${closestFlight.destination}`,
        `Status: ${statusIcon} ${closestFlight.status}`,
        `Distance: ${closestFlight.distance ? closestFlight.distance.toFixed(1) : 'Unknown'}km`,
        `Alt: ${closestFlight.altitude.toLocaleString()}ft | Speed: ${closestFlight.speed}mph`,
        `Aircraft: ${closestFlight.aircraft}`,
        ''
      ];

      if (flightData.length > 1) {
        tooltipLines.push('Other nearby flights:');
        flightData.slice(1, 4).forEach(flight => {
          tooltipLines.push(`• ${flight.flightNumber} (${flight.distance ? flight.distance.toFixed(1) : 'Unknown'}km)`);
        });
        if (flightData.length > 4) {
          tooltipLines.push(`• ... and ${flightData.length - 4} more`);
        }
        tooltipLines.push('');
      }

      tooltipLines.push('💡 Click to view details');
      tooltipLines.push('🖱️ Right-click for menu');
      
      mb.tray.setTitle('✈️' + displayText);
      mb.tray.setToolTip(tooltipLines.join('\n'));
      
      console.log(`Menu bar updated: ${displayText} (${flightData.length} flights)`);
    } else {
      // No flights nearby - show subtle indicator
      if (mb && mb.tray) {
        mb.tray.setTitle('✈️');
        const refreshMinutes = flightService.getSettings().refreshIntervalMinutes;
        mb.tray.setToolTip([
          'FlightAbove - No flights nearby',
          '',
          `📍 Location: ${location ? 'Detected' : 'Unknown'}`,
          `🔄 Updates every ${refreshMinutes} minute${refreshMinutes > 1 ? 's' : ''}`,
          '',
          '💡 Click to view details',
          '🖱️ Right-click for menu'
        ].join('\n'));
        console.log('Menu bar updated: No flights nearby');
      }
    }
    
    // Send updates to renderer
    if (mb && mb.window) {
      mb.window.webContents.send('flight-data-update', flightData || []);
    }
  } catch (error) {
    console.error('Error updating menu bar:', error);
    if (mb && mb.tray) {
      mb.tray.setTitle('✈️💥');
      mb.tray.setToolTip([
        'FlightAbove - Error getting flight data',
        '',
        `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        '🔄 Will retry automatically',
        '',
        '💡 Click to view details',
        '🖱️ Right-click for menu'
      ].join('\n'));
    }
  }
};

const createMenuBar = () => {
  // Create a transparent icon to avoid the default cat icon
  const transparentIcon = nativeImage.createEmpty();
  transparentIcon.resize({ width: 16, height: 16 });
  
  mb = menubar({
    index: isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../renderer/index.html')}`,
    icon: transparentIcon, // Use transparent icon to avoid default cat
    tooltip: 'FlightAbove - Current flights overhead',
    browserWindow: {
      width: 500,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      resizable: false, // Fixed size window
      skipTaskbar: true,
      alwaysOnTop: false, // Allow window to hide when clicking away
    },
    preloadWindow: true,
    showOnAllWorkspaces: true,
    showDockIcon: false,
    showOnRightClick: false // Disable right-click to show window, we have context menu
  });

  mb.on('ready', () => {
    console.log('FlightAbove is ready!');
    
    // Initial update
    updateMenuBarDisplay();
    
    // Set up periodic updates using FlightService settings
    const flightService = FlightService.getInstance();
    const refreshInterval = flightService.getRefreshIntervalMs();
    console.log(`Setting refresh interval to ${refreshInterval / 1000} seconds`);
    setInterval(updateMenuBarDisplay, refreshInterval);
    
    // Create enhanced context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🔄 Refresh Now',
        click: () => {
          updateMenuBarDisplay();
        }
      },

      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          if (mb.window) {
            mb.showWindow();
            mb.window.webContents.send('show-settings');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'About',
        click: () => {
          shell.openExternal('https://github.com/LouisXO/FlightAbove');
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
    
    // Handle clicks - just show the window
    mb.tray.on('click', () => {
      if (mb.window) {
        mb.showWindow();
        // Send current flight data to renderer when window is shown
        const lastFlightData = flightService.getLastFlightData();
        mb.window.webContents.send('flight-data-update', lastFlightData || []);
      }
    });
  });

  mb.on('create-window', () => {
    mb.window?.on('closed', () => {
      mb.window = null;
    });
    
    // Hide window when it loses focus (clicking away)
    mb.window?.on('blur', () => {
      if (mb.window) {
        mb.hideWindow();
      }
    });
    
    // Send initial flight data when window is ready
    mb.window?.webContents.once('did-finish-load', () => {
      if (mb.window) {
        const lastFlightData = flightService.getLastFlightData();
        mb.window.webContents.send('flight-data-update', lastFlightData || []);
      }
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