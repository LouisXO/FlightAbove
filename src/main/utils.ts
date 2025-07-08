import { app } from 'electron';

export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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