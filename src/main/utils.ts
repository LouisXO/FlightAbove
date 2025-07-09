import { app } from 'electron';

// Check if we're running from the development server or built files
export const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';

export const isProduction = !isDev;

export const getAppVersion = () => app.getVersion();

export const getAppName = () => app.getName();

export const getUserDataPath = () => app.getPath('userData');

export const getAssetPath = (assetName: string) => {
  if (isDev) {
    return `${process.cwd()}/assets/${assetName}`;
  }
  return `${process.resourcesPath}/assets/${assetName}`;
}; 