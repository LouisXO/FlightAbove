export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private watchId: number | null = null;
  private lastLocationUpdate: Date | null = null;
  private locationUpdateInterval: number = 30 * 60 * 1000; // 30 minutes

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private constructor() {}

  public async getCurrentLocation(): Promise<Location> {
    // If we have a cached location and it's still fresh, return it
    if (this.currentLocation && this.lastLocationUpdate) {
      const timeSinceUpdate = Date.now() - this.lastLocationUpdate.getTime();
      if (timeSinceUpdate < this.locationUpdateInterval) {
        return this.currentLocation;
      }
    }

    try {
      // Try to get real location from IP geolocation
      const realLocation = await this.getLocationFromIP();
      this.currentLocation = realLocation;
      this.lastLocationUpdate = new Date();
      return realLocation;
    } catch (error) {
      console.error('Error getting location, using fallback:', error);
      
      // If we have any cached location, use it
      if (this.currentLocation) {
        console.log('Using cached location due to API error');
        return this.currentLocation;
      }
      
      // Fallback to Pittsburgh, PA (based on user's previous location)
      const fallbackLocation: Location = {
        latitude: 40.4406,
        longitude: -79.9959,
        accuracy: 10000
      };
      this.currentLocation = fallbackLocation;
      this.lastLocationUpdate = new Date();
      console.log('Using fallback location: Pittsburgh, PA');
      return fallbackLocation;
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
    // Check for location updates every 5 minutes (but the actual API calls are cached for 30 minutes)
    this.watchId = setInterval(async () => {
      try {
        const location = await this.getCurrentLocation();
        callback(location);
      } catch (error) {
        console.error('Error in location update:', error);
      }
    }, 5 * 60 * 1000) as unknown as number; // 5 minutes
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
    // List of IP geolocation services to try
    const services = [
      {
        url: 'https://ipapi.co/json/',
        parser: (data: any) => ({
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          region: data.region,
          country: data.country
        })
      },
      {
        url: 'https://ip-api.com/json/',
        parser: (data: any) => ({
          latitude: data.lat,
          longitude: data.lon,
          city: data.city,
          region: data.regionName,
          country: data.country
        })
      },
      {
        url: 'https://ipinfo.io/json',
        parser: (data: any) => {
          const [lat, lon] = data.loc ? data.loc.split(',') : [0, 0];
          return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            city: data.city,
            region: data.region,
            country: data.country
          };
        }
      }
    ];

    // Try each service in order
    for (let i = 0; i < services.length; i++) {
      try {
        const service = services[i];
        console.log(`Attempting IP geolocation with service ${i + 1}/${services.length}`);
        
        const response = await fetch(service.url, {
          headers: {
            'User-Agent': 'FlightAbove/1.0'
          }
        });

        if (!response.ok) {
          console.log(`Service ${i + 1} responded with status ${response.status}`);
          continue;
        }

        const text = await response.text();
        
        // Check if response looks like an error message
        if (text.toLowerCase().includes('too many') || text.toLowerCase().includes('rate limit')) {
          console.log(`Service ${i + 1} rate limited, trying next service`);
          continue;
        }

        const data = JSON.parse(text);
        const locationData = service.parser(data);
        
        if (!locationData.latitude || !locationData.longitude) {
          console.log(`Service ${i + 1} returned invalid coordinates`);
          continue;
        }

        console.log(`Location detected: ${locationData.city}, ${locationData.region}, ${locationData.country}`);
        
        return {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: 10000 // IP location is less accurate
        };
        
      } catch (error) {
        console.log(`Service ${i + 1} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    // If all services failed, throw an error
    throw new Error('All IP geolocation services failed');
  }
} 