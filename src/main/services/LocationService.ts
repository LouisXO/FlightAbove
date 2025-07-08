export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private constructor() {}

  public async getCurrentLocation(): Promise<Location> {
    try {
      // For development, return a mock location (San Francisco)
      // In production, this would request actual location from macOS
      const mockLocation: Location = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 100
      };

      this.currentLocation = mockLocation;
      return mockLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      throw new Error('Unable to get location');
    }
  }

  public async requestLocationPermission(): Promise<boolean> {
    try {
      // TODO: Implement actual macOS location permission request
      // This would use native macOS APIs through Electron
      console.log('Requesting location permission...');
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  public startLocationUpdates(callback: (location: Location) => void): void {
    // TODO: Implement continuous location monitoring
    // For now, just call the callback with mock data every 30 seconds
    this.watchId = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        callback(location);
      } catch (error) {
        console.error('Error in location update:', error);
      }
    }, 30000) as unknown as number;
  }

  public stopLocationUpdates(): void {
    if (this.watchId !== null) {
      clearInterval(this.watchId);
      this.watchId = null;
    }
  }

  public getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  private async getLocationFromMacOS(): Promise<Location> {
    // TODO: Implement actual macOS location API calls
    // This would require native code or a native module
    // For now, return mock data
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 100
    };
  }

  private async getLocationFromIP(): Promise<Location> {
    // Fallback method using IP geolocation
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json() as any;
      
      return {
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        accuracy: 10000 // IP location is less accurate
      };
    } catch (error) {
      console.error('Error getting IP location:', error);
      throw error;
    }
  }
} 