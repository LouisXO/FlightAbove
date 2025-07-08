import { contextBridge, ipcRenderer } from 'electron';

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Flight data APIs
  getFlightData: () => ipcRenderer.invoke('get-flight-data'),
  
  // Location APIs
  getCurrentLocation: () => ipcRenderer.invoke('get-current-location'),
  
  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: any) => ipcRenderer.invoke('set-settings', settings),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // API Key Management
  setFlightRadar24ApiKey: (apiKey: string) => ipcRenderer.invoke('set-flightradar24-api-key', apiKey),
  getFlightRadar24ApiKey: () => ipcRenderer.invoke('get-flightradar24-api-key'),
  hasFlightRadar24ApiKey: () => ipcRenderer.invoke('has-flightradar24-api-key'),
  removeFlightRadar24ApiKey: () => ipcRenderer.invoke('remove-flightradar24-api-key'),
  getAllApiKeys: () => ipcRenderer.invoke('get-all-api-keys'),
  
  // Airline Logo Management
  getAirlineLogo: (airlineCode: string) => ipcRenderer.invoke('get-airline-logo', airlineCode),
  
  // Event listeners
  onFlightDataUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('flight-data-update', (_event, data) => callback(data));
  },
  
  onLocationUpdate: (callback: (location: any) => void) => {
    ipcRenderer.on('location-update', (_event, location) => callback(location));
  },
  
  // Generic event listener
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// TypeScript declarations
declare global {
  interface Window {
    electronAPI: {
      getFlightData: () => Promise<any>;
      getCurrentLocation: () => Promise<any>;
      getSettings: () => Promise<any>;
      setSettings: (settings: any) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      setFlightRadar24ApiKey: (apiKey: string) => Promise<{ success: boolean }>;
      getFlightRadar24ApiKey: () => Promise<string | null>;
      hasFlightRadar24ApiKey: () => Promise<boolean>;
      removeFlightRadar24ApiKey: () => Promise<{ success: boolean }>;
      getAllApiKeys: () => Promise<{ flightRadar24: boolean; openSkyNetwork: boolean }>;
      getAirlineLogo: (airlineCode: string) => Promise<string | null>;
      onFlightDataUpdate: (callback: (data: any) => void) => void;
      onLocationUpdate: (callback: (location: any) => void) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
} 