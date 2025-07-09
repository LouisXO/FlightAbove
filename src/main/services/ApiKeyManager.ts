import Store from 'electron-store';
import { safeStorage } from 'electron';

interface StoreData {
  encryptedFlightRadar24Key?: string;
  airlineLogos?: { [key: string]: string }; // Cache for airline logos
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private store: Store<StoreData>;
  private flightRadar24ApiKey: string | null = null;
  private logoCache: Map<string, string | null> = new Map();
  private airlineDatabase: any[] | null = null;
  private airlineDatabaseLastFetch: number = 0;
  
  // Airline database URL
  private readonly AIRLINE_DATABASE_URL = 'https://raw.githubusercontent.com/dotmarn/Airlines/refs/heads/master/airlines.json';

  private constructor() {
    this.store = new Store<StoreData>({
      name: 'flight-above-config',
      encryptionKey: 'flight-above-secure-key'
    });
  }

  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  public setFlightRadar24ApiKey(apiKey: string): void {
    // Encrypt the API key if available
    if (safeStorage.isEncryptionAvailable()) {
      const encryptedKey = safeStorage.encryptString(apiKey);
      this.store.set('encryptedFlightRadar24Key', encryptedKey.toString('base64'));
    } else {
      // Fallback to plain text (not recommended for production)
      this.store.set('encryptedFlightRadar24Key', apiKey);
    }
    console.log('FlightRadar24 API key updated');
  }

  public getFlightRadar24ApiKey(): string | null {
    const encryptedKey = this.store.get('encryptedFlightRadar24Key');
    if (!encryptedKey) return null;

    try {
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encryptedKey, 'base64');
        return safeStorage.decryptString(buffer);
      } else {
        return encryptedKey;
      }
    } catch (error) {
      console.error('Error decrypting FlightRadar24 API key:', error);
      return null;
    }
  }

  public setOpenSkyApiKey(apiKey: string): void {
    // For now, just log - we're not using OpenSky API
    console.log('OpenSky Network API key setting not implemented');
  }

  public getOpenSkyApiKey(): string | null {
    return null;
  }

  public hasFlightRadar24ApiKey(): boolean {
    return !!this.getFlightRadar24ApiKey();
  }

  public hasOpenSkyApiKey(): boolean {
    return false;
  }

  public removeFlightRadar24ApiKey(): void {
    this.store.delete('encryptedFlightRadar24Key');
    console.log('FlightRadar24 API key removed');
  }

  public removeOpenSkyApiKey(): void {
    console.log('OpenSky Network API key removal not implemented');
  }

  public getAllApiKeys(): { flightRadar24: boolean; openSkyNetwork: boolean } {
    return {
      flightRadar24: this.hasFlightRadar24ApiKey(),
      openSkyNetwork: this.hasOpenSkyApiKey()
    };
  }

  public async getAirlineLogo(airlineCode: string): Promise<string | null> {
    try {
      // Check if we have cached logo
      const cachedLogos = this.store.get('airlineLogos', {});
      if (cachedLogos[airlineCode]) {
        return cachedLogos[airlineCode];
      }

      // Try to fetch from airline database
      const logoUrl = await this.fetchAirlineLogoFromDatabase(airlineCode);
      if (logoUrl) {
        // Cache the logo URL
        cachedLogos[airlineCode] = logoUrl;
        this.store.set('airlineLogos', cachedLogos);
        return logoUrl;
      }

      return null;
    } catch (error) {
      console.error('Error getting airline logo:', error);
      return null;
    }
  }

  private async fetchAirlineLogoFromDatabase(airlineCode: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.logoCache.has(airlineCode)) {
        return this.logoCache.get(airlineCode) || null;
      }

      // Skip aircraft tail numbers (N-numbers) - these are private aircraft, not airlines
      if (airlineCode.match(/^N\d+$/)) {
        console.log(`Skipping aircraft tail number: ${airlineCode}`);
        this.logoCache.set(airlineCode, null);
        return null;
      }

      // Fetch airline database if not cached or if cache is old (1 hour)
      if (!this.airlineDatabase || Date.now() - this.airlineDatabaseLastFetch > 3600000) {
        await this.fetchAirlineDatabase();
      }

      if (!this.airlineDatabase) {
        console.log('Failed to fetch airline database');
        this.logoCache.set(airlineCode, null);
        return null;
      }

      // Search for airline by code
      const airline = this.airlineDatabase.find(a => a.id === airlineCode.toUpperCase());
      
      if (airline && airline.logo) {
        // Cache the successful URL
        this.logoCache.set(airlineCode, airline.logo);
        return airline.logo;
      } else {
        console.log(`Logo not found for airline code: ${airlineCode}`);
        // Cache the negative result to avoid repeated requests
        this.logoCache.set(airlineCode, null);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching airline logo for ${airlineCode}:`, error);
      // Cache the negative result 
      this.logoCache.set(airlineCode, null);
      return null;
    }
  }

  private async fetchAirlineDatabase(): Promise<void> {
    try {
      console.log('Fetching airline database...');
      const response = await fetch(this.AIRLINE_DATABASE_URL);
      
      if (response.ok) {
        this.airlineDatabase = await response.json() as any[];
        this.airlineDatabaseLastFetch = Date.now();
        console.log(`Fetched airline database with ${this.airlineDatabase?.length} airlines`);
      } else {
        console.error('Failed to fetch airline database:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching airline database:', error);
    }
  }

  public clearAirlineLogosCache(): void {
    this.store.delete('airlineLogos');
  }
} 