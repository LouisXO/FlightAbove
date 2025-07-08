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

  // Mapping of airline codes to soaring-symbols filenames
  private airlineLogoMapping: { [key: string]: string } = {
    // Major US Airlines (only including those confirmed to exist in repository)
    'UA': 'united-airlines.svg',
    'UAL': 'united-airlines.svg',
    'WN': 'southwest-airlines.svg',
    'SWA': 'southwest-airlines.svg',
    // Note: Delta, American Airlines, JetBlue, Alaska Airlines, etc. 
    // are not currently available in the soaring-symbols repository
    
    // European Airlines
    'LH': 'lufthansa.svg',
    'DLH': 'lufthansa.svg',
    'BA': 'british-airways.svg',
    'BAW': 'british-airways.svg',
    'AF': 'air-france.svg',
    'AFR': 'air-france.svg',
    'KL': 'klm.svg',
    'KLM': 'klm.svg',
    'LX': 'swiss-international-air-lines.svg',
    'SWR': 'swiss-international-air-lines.svg',
    'OS': 'austrian-airlines.svg',
    'AUA': 'austrian-airlines.svg',
    'SN': 'brussels-airlines.svg',
    'BEL': 'brussels-airlines.svg',
    'IB': 'iberia.svg',
    'IBE': 'iberia.svg',
    'AZ': 'alitalia.svg',
    'AZA': 'alitalia.svg',
    'TP': 'tap-air-portugal.svg',
    'TAP': 'tap-air-portugal.svg',
    'A3': 'aegean-airlines.svg',
    'AEE': 'aegean-airlines.svg',
    'SK': 'scandinavian-airlines.svg',
    'SAS': 'scandinavian-airlines.svg',
    'AY': 'finnair.svg',
    'FIN': 'finnair.svg',
    'FR': 'ryanair.svg',
    'RYR': 'ryanair.svg',
    'U2': 'easyjet.svg',
    'EZY': 'easyjet.svg',
    'VY': 'vueling.svg',
    'VLG': 'vueling.svg',
    'W6': 'wizz-air.svg',
    'WZZ': 'wizz-air.svg',
    
    // Middle Eastern Airlines
    'EK': 'emirates.svg',
    'UAE': 'emirates.svg',
    'QR': 'qatar-airways.svg',
    'QTR': 'qatar-airways.svg',
    'EY': 'etihad-airways.svg',
    'ETD': 'etihad-airways.svg',
    'MS': 'egyptair.svg',
    'MSR': 'egyptair.svg',
    'TK': 'turkish-airlines.svg',
    'THY': 'turkish-airlines.svg',
    'SV': 'saudi-arabian-airlines.svg',
    'SVA': 'saudi-arabian-airlines.svg',
    
    // Asian Airlines
    'SQ': 'singapore-airlines.svg',
    'SIA': 'singapore-airlines.svg',
    'CX': 'cathay-pacific.svg',
    'CPA': 'cathay-pacific.svg',
    'JL': 'japan-airlines.svg',
    'JAL': 'japan-airlines.svg',
    'NH': 'all-nippon-airways.svg',
    'ANA': 'all-nippon-airways.svg',
    'KE': 'korean-air.svg',
    'KAL': 'korean-air.svg',
    'OZ': 'asiana-airlines.svg',
    'AAR': 'asiana-airlines.svg',
    'TG': 'thai-airways.svg',
    'THA': 'thai-airways.svg',
    'MH': 'malaysia-airlines.svg',
    'MAS': 'malaysia-airlines.svg',
    'CI': 'china-airlines.svg',
    'CAL': 'china-airlines.svg',
    'BR': 'eva-air.svg',
    'EVA': 'eva-air.svg',
    'CZ': 'china-southern-airlines.svg',
    'CSN': 'china-southern-airlines.svg',
    'CA': 'air-china.svg',
    'CCA': 'air-china.svg',
    'MU': 'china-eastern-airlines.svg',
    'CES': 'china-eastern-airlines.svg',
    'AI': 'air-india.svg',
    'AIC': 'air-india.svg',
    '6E': 'indigo.svg',
    'IGO': 'indigo.svg',
    'SG': 'spicejet.svg',
    'SEJ': 'spicejet.svg',
    
    // Canadian Airlines
    'AC': 'air-canada.svg',
    'ACA': 'air-canada.svg',
    'WS': 'westjet.svg',
    'WJA': 'westjet.svg',
    'PD': 'porter-airlines.svg',
    'POE': 'porter-airlines.svg',
    
    // Australian/Oceania Airlines
    'QF': 'qantas.svg',
    'QFA': 'qantas.svg',
    'JQ': 'jetstar.svg',
    'JST': 'jetstar.svg',
    'VA': 'virgin-australia.svg',
    'VOZ': 'virgin-australia.svg',
    'NZ': 'air-new-zealand.svg',
    'ANZ': 'air-new-zealand.svg',
    'FJ': 'fiji-airways.svg',
    'FJI': 'fiji-airways.svg',
    
    // Latin American Airlines
    'AM': 'aeromexico.svg',
    'AMX': 'aeromexico.svg',
    'AV': 'avianca.svg',
    'AVA': 'avianca.svg',
    'LA': 'latam.svg',
    'LAN': 'latam.svg',
    'G3': 'gol.svg',
    'GLO': 'gol.svg',
    'JJ': 'tam.svg',
    'TAM': 'tam.svg',
    'AR': 'aerolineas-argentinas.svg',
    'ARG': 'aerolineas-argentinas.svg',
    'CM': 'copa-airlines.svg',
    'CMP': 'copa-airlines.svg',
    
    // African Airlines
    'SA': 'south-african-airways.svg',
    'SAA': 'south-african-airways.svg',
    'ET': 'ethiopian-airlines.svg',
    'ETH': 'ethiopian-airlines.svg',
    'AT': 'royal-air-maroc.svg',
    'RAM': 'royal-air-maroc.svg',
    'KQ': 'kenya-airways.svg',
    'KQA': 'kenya-airways.svg',
    
    // Regional/Charter Airlines
    'RPA': 'republic-airways.svg',
    'SKW': 'skywest-airlines.svg',
    'PDT': 'piedmont-airlines.svg',
    'PSA': 'psa-airlines.svg',
    'ENY': 'envoy-air.svg',
    'ASH': 'mesa-airlines.svg',
    'TCF': 'shuttle-america.svg',
    'GJS': 'gojet-airlines.svg',
    'CPZ': 'compass-airlines.svg',
    'FLG': 'flagship.svg',
    
    // Note: Most cargo airlines (UPS, FedEx, etc.) and special airlines 
    // are not available in the soaring-symbols repository
  };

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

      // Try to fetch from soaring-symbols repository
      const logoUrl = await this.fetchAirlineLogoFromGitHub(airlineCode);
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

  private async fetchAirlineLogoFromGitHub(airlineCode: string): Promise<string | null> {
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

      // Get the correct filename from mapping
      const filename = this.airlineLogoMapping[airlineCode.toUpperCase()];
      if (!filename) {
        console.log(`No logo mapping found for airline code: ${airlineCode}`);
        this.logoCache.set(airlineCode, null);
        return null;
      }

      const logoUrl = `https://raw.githubusercontent.com/anhthang/soaring-symbols/main/icons/${filename}`;
      
      // Test if the logo exists
      const response = await fetch(logoUrl, { method: 'HEAD' });
      
      if (response.ok) {
        // Cache the successful URL
        this.logoCache.set(airlineCode, logoUrl);
        return logoUrl;
      } else {
        console.log(`Logo not found for ${airlineCode} at ${logoUrl}`);
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

  public clearAirlineLogosCache(): void {
    this.store.delete('airlineLogos');
  }
} 