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
  
  // Event listeners
  onFlightDataUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('flight-data-update', (_event, data) => callback(data));
  },
  
  onLocationUpdate: (callback: (location: any) => void) => {
    ipcRenderer.on('location-update', (_event, location) => callback(location));
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
      onFlightDataUpdate: (callback: (data: any) => void) => void;
      onLocationUpdate: (callback: (location: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
} 