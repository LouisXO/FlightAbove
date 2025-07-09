import axios from 'axios';
import { ApiKeyManager } from './ApiKeyManager';

export interface FlightData {
  callsign: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  altitude: number;
  speed: number;
  heading: number;
  latitude: number;
  longitude: number;
  status: 'On Time' | 'Delayed' | 'Cancelled' | 'Unknown';
  estimatedArrival: string;
  flightRadarUrl?: string;
  distance?: number; // Add distance for sorting
  airlineCode?: string; // Add airline code for logo lookup
  registration?: string;
  aircraftType?: string;
  originIATA?: string;
  destinationIATA?: string;
  eta?: string;
}

export interface CreditUsage {
  creditsUsed: number;
  flightsReturned: number;
  endpoint: string;
  timestamp: number;
  estimatedCost: number; // Estimated cost in USD (assuming $0.0003 per credit)
}

export interface FlightServiceSettings {
  refreshIntervalMinutes: number; // Default: 30 minutes
  maxFlightsPerRequest: number;   // Default: 1 flight
  radiusKm: number;              // Default: 20km
  useFullEndpoint: boolean;       // Default: true (use full endpoint)
  demoMode: boolean;             // Default: false (enables demo mode without API key)
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ApiError {
  type: 'payment_required' | 'invalid_key' | 'rate_limit' | 'network' | 'other';
  message: string;
  timestamp: number;
  statusCode?: number;
  details?: string;
}

export class FlightService {
  private static instance: FlightService;
  private lastFlightData: FlightData[] = []; // Changed to array
  private apiKeyManager: ApiKeyManager;
  private creditUsageHistory: CreditUsage[] = [];
  private lastApiError: ApiError | null = null;
  private settings: FlightServiceSettings = {
    refreshIntervalMinutes: 30,  // 1 minute for frequent updates
    maxFlightsPerRequest: 1,    // Limit to 3 flights per request
    radiusKm: 20,              // 50km radius
    useFullEndpoint: true,     // Use full endpoint for complete data
    demoMode: false           // Demo mode disabled by default
  };
  private demoFlightTemplates = [
    {
      callsigns: ['UAL1234', 'UAL5678', 'UAL9012'],
      airline: 'United Airlines',
      flightNumbers: ['UA1234', 'UA5678', 'UA9012'],
      origins: ['LAX', 'SFO', 'DEN'],
      destinations: ['JFK', 'ORD', 'IAH'],
      aircraft: ['Boeing 737-800', 'Boeing 777-200', 'Airbus A320'],
      airlineCode: 'UAL'
    },
    {
      callsigns: ['AAL5678', 'AAL3456', 'AAL7890'],
      airline: 'American Airlines',
      flightNumbers: ['AA5678', 'AA3456', 'AA7890'],
      origins: ['DFW', 'MIA', 'PHX'],
      destinations: ['ORD', 'BOS', 'LGA'],
      aircraft: ['Airbus A320', 'Boeing 737-800', 'Boeing 777-300'],
      airlineCode: 'AAL'
    },
    {
      callsigns: ['DAL9876', 'DAL2468', 'DAL1357'],
      airline: 'Delta Air Lines',
      flightNumbers: ['DL9876', 'DL2468', 'DL1357'],
      origins: ['ATL', 'MSP', 'DTW'],
      destinations: ['SEA', 'LAX', 'JFK'],
      aircraft: ['Boeing 757-200', 'Airbus A330', 'Boeing 737-900'],
      airlineCode: 'DAL'
    },
    {
      callsigns: ['SWA1111', 'SWA2222', 'SWA3333'],
      airline: 'Southwest Airlines',
      flightNumbers: ['WN1111', 'WN2222', 'WN3333'],
      origins: ['MDW', 'BWI', 'LAS'],
      destinations: ['LAX', 'DEN', 'PHX'],
      aircraft: ['Boeing 737-700', 'Boeing 737-800', 'Boeing 737 MAX 8'],
      airlineCode: 'SWA'
    },
    {
      callsigns: ['JBU4567', 'JBU8901', 'JBU2345'],
      airline: 'JetBlue Airways',
      flightNumbers: ['B64567', 'B68901', 'B62345'],
      origins: ['JFK', 'BOS', 'FLL'],
      destinations: ['LAX', 'SFO', 'SEA'],
      aircraft: ['Airbus A320', 'Airbus A321', 'Embraer E190'],
      airlineCode: 'JBU'
    }
  ];

  public static getInstance(): FlightService {
    if (!FlightService.instance) {
      FlightService.instance = new FlightService();
    }
    return FlightService.instance;
  }

  private constructor() {
    this.apiKeyManager = ApiKeyManager.getInstance();
  }

  public async getFlightData(location: Location): Promise<FlightData[]> {
    try {
      // Check if demo mode is enabled
      if (this.settings.demoMode) {
        console.log('Demo mode enabled - generating realistic flight data...');
        const demoFlightData = this.generateDemoFlightData(location);
        this.lastFlightData = demoFlightData;
        // Simulate credit usage tracking for demo mode
        this.trackCreditUsage(demoFlightData.length, this.settings.useFullEndpoint ? 'full' : 'light');
        return demoFlightData;
      }

      // Check if we have an API key for real data
      if (!this.apiKeyManager.hasFlightRadar24ApiKey()) {
        // Don't spam the console when no API key is configured
        return [];
      }

      console.log('Attempting to fetch real flight data from FlightRadar24...');
      const realFlightData = await this.getFlightDataFromFlightRadar24(location);
      if (realFlightData && realFlightData.length > 0) {
        this.lastFlightData = realFlightData;
        return realFlightData;
      }
      console.log('No real flights found nearby');
      return [];
    } catch (error) {
      console.error('Error fetching flight data:', error);
      return [];
    }
  }

  private getMockFlightData(location: Location): FlightData[] {
    // Mock flights are no longer used - return empty array
    return [];
  }

  private generateDemoFlightData(location: Location): FlightData[] {
    const flights: FlightData[] = [];
    const now = new Date();
    
    // For demo mode, always generate at least 2 flights for demonstration, up to 5 flights
    // This ensures the demo mode is useful for showcasing features with good variety
    const maxFlights = Math.max(Math.min(this.settings.maxFlightsPerRequest, 10), 10);
    const flightCount = Math.min(Math.floor(Math.random() * 5) + 10, maxFlights); // Generate 2-6 flights for demo
    
    console.log(`Demo mode: Generating ${flightCount} flights (max: ${maxFlights})`);
    
    for (let i = 0; i < flightCount; i++) {
      const template = this.demoFlightTemplates[Math.floor(Math.random() * this.demoFlightTemplates.length)];
      const callsignIndex = Math.floor(Math.random() * template.callsigns.length);
      
      // Generate realistic position within radius
      const radiusInDegrees = this.settings.radiusKm / 111; // Rough conversion to degrees
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusInDegrees;
      
      const flightLat = location.latitude + Math.cos(angle) * distance;
      const flightLng = location.longitude + Math.sin(angle) * distance;
      
      // Generate realistic flight data
      const flight: FlightData = {
        callsign: template.callsigns[callsignIndex],
        airline: template.airline,
        flightNumber: template.flightNumbers[callsignIndex],
        origin: template.origins[Math.floor(Math.random() * template.origins.length)],
        destination: template.destinations[Math.floor(Math.random() * template.destinations.length)],
        aircraft: template.aircraft[Math.floor(Math.random() * template.aircraft.length)],
        altitude: Math.floor(Math.random() * 20000) + 25000, // 25,000 - 45,000 ft
        speed: Math.floor(Math.random() * 200) + 400, // 400 - 600 mph
        heading: Math.floor(Math.random() * 360),
        latitude: flightLat,
        longitude: flightLng,
        status: Math.random() < 0.8 ? 'On Time' : (Math.random() < 0.5 ? 'Delayed' : 'Unknown'),
        estimatedArrival: new Date(now.getTime() + Math.random() * 8 * 60 * 60 * 1000).toISOString(),
        flightRadarUrl: `https://www.flightradar24.com/${template.callsigns[callsignIndex]}`,
        distance: this.calculateDistance(location.latitude, location.longitude, flightLat, flightLng),
        airlineCode: template.airlineCode,
        registration: this.generateRegistration(template.airlineCode),
        aircraftType: template.aircraft[Math.floor(Math.random() * template.aircraft.length)],
        originIATA: template.origins[Math.floor(Math.random() * template.origins.length)],
        destinationIATA: template.destinations[Math.floor(Math.random() * template.destinations.length)],
        eta: new Date(now.getTime() + Math.random() * 6 * 60 * 60 * 1000).toISOString()
      };
      
      flights.push(flight);
    }
    
    // Sort by distance (closest first)
    const sortedFlights = flights.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    console.log(`Demo mode: Generated ${sortedFlights.length} flights successfully`);
    return sortedFlights;
  }

  private generateRegistration(airlineCode: string): string {
    // Generate realistic aircraft registration numbers
    const prefixes = {
      'UAL': 'N',
      'AAL': 'N',
      'DAL': 'N',
      'SWA': 'N',
      'JBU': 'N'
    };
    
    const prefix = prefixes[airlineCode as keyof typeof prefixes] || 'N';
    const digits = Math.floor(Math.random() * 90000) + 10000;
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    return `${prefix}${digits}${suffix}`;
  }

  public async getFlightsInArea(location: Location, radiusKm: number = 50): Promise<FlightData[]> {
    try {
      // Use demo mode if enabled
      if (this.settings.demoMode) {
        return this.generateDemoFlightData(location);
      }
      
      // TODO: Implement actual API call to get flights in area
      // This would typically call FlightRadar24 API or similar
      return [];
    } catch (error) {
      console.error('Error fetching flights in area:', error);
      return [];
    }
  }

  private async getFlightDataFromFlightRadar24(location: Location): Promise<FlightData[]> {
    try {
      const apiKey = this.apiKeyManager.getFlightRadar24ApiKey();
      if (!apiKey) {
        throw new Error('No FlightRadar24 API key available');
      }

      // Choose endpoint based on settings (light saves credits: 6 vs 8 per flight)
      const endpoint = this.settings.useFullEndpoint 
        ? 'https://fr24api.flightradar24.com/api/live/flight-positions/full'
        : 'https://fr24api.flightradar24.com/api/live/flight-positions/light';
      
      // Calculate bounds based on settings radius
      const latitudeDegreePerKm = 1 / 111; // Approximate conversion
      const longitudeDegreePerKm = 1 / (111 * Math.cos(location.latitude * Math.PI / 180));
      const radiusDegrees = this.settings.radiusKm * Math.max(latitudeDegreePerKm, longitudeDegreePerKm);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Accept-Version': 'v1'
        },
        params: {
          // Create bounding box based on configured radius
          bounds: `${location.latitude + radiusDegrees},${location.latitude - radiusDegrees},${location.longitude - radiusDegrees},${location.longitude + radiusDegrees}`,
          // Limit results to save credits
          limit: this.settings.maxFlightsPerRequest
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('FlightRadar24 API response received');
      
      // Clear any previous API errors on successful response
      this.lastApiError = null;
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // FlightRadar24 live flight positions API returns an array of flights
        const flights = response.data.data;
        
        console.log(`Found ${flights.length} flights in the area`);
        
        // Track credit usage
        this.trackCreditUsage(flights.length, this.settings.useFullEndpoint ? 'full' : 'light');
        
        if (flights.length > 0) {
          // Find all nearby flights and sort by distance
          const nearbyFlights = this.findNearbyFlights(flights, location, this.settings.radiusKm);
          console.log(`Filtered ${nearbyFlights.length} nearby flights from ${flights.length} total`);
          
          if (nearbyFlights.length > 0) {
            const flightDataArray = nearbyFlights.map(flight => this.parseFlightRadar24LightData(flight));
            console.log(`Parsed ${flightDataArray.length} flight data objects`);
            return flightDataArray;
          }
        }
      } else {
        console.log('Unexpected API response format:', response.data);
      }

      return [];
    } catch (error) {
      // console.error('FlightRadar24 API error:', error);
      
      // Check if it's an axios error with response
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const responseData = error.response?.data;
        
        console.error(`FlightRadar24 API HTTP Error: ${status} ${statusText}`);
        
        if (status === 401) {
          this.lastApiError = {
            type: 'invalid_key',
            message: 'Invalid API key',
            timestamp: Date.now(),
            statusCode: status,
            details: 'Your FlightRadar24 API key is invalid or expired. Please check your API key in settings.'
          };
        } else if (status === 402) {
          this.lastApiError = {
            type: 'payment_required',
            message: 'Credit limit reached',
            timestamp: Date.now(),
            statusCode: status,
            details: responseData?.details || 'Your FlightRadar24 subscription has run out of credits. Please top up your account or upgrade your plan.'
          };
        } else if (status === 403) {
          this.lastApiError = {
            type: 'invalid_key',
            message: 'Access forbidden',
            timestamp: Date.now(),
            statusCode: status,
            details: 'Your API key does not have permission for this endpoint.'
          };
        } else if (status === 404) {
          this.lastApiError = {
            type: 'other',
            message: 'Endpoint not found',
            timestamp: Date.now(),
            statusCode: status,
            details: 'The FlightRadar24 API endpoint was not found. The API URL may be incorrect.'
          };
        } else if (status === 429) {
          this.lastApiError = {
            type: 'rate_limit',
            message: 'Rate limit exceeded',
            timestamp: Date.now(),
            statusCode: status,
            details: 'Too many requests. Please wait a moment before trying again.'
          };
        } else {
          this.lastApiError = {
            type: 'other',
            message: 'API error',
            timestamp: Date.now(),
            statusCode: status,
            details: statusText || 'An unexpected error occurred with the FlightRadar24 API.'
          };
        }
        
        // Log response data for debugging
        if (error.response?.data) {
          console.error('API Response:', error.response.data);
        }
      } else {
        this.lastApiError = {
          type: 'network',
          message: 'Network error',
          timestamp: Date.now(),
          details: 'Unable to connect to FlightRadar24 API. Please check your internet connection.'
        };
      }
      
      // Don't throw error, return empty array to allow UI to show error message
      return [];
    }
  }

  private findClosestFlight(aircraft: any[], userLocation: Location): any | null {
    if (!aircraft || aircraft.length === 0) return null;

    let closestFlight = null;
    let minDistance = Infinity;

    for (const flight of aircraft) {
      if (flight.lat && flight.lng) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          flight.lat,
          flight.lng
        );
        
        // Only consider flights that are reasonably overhead (within 25km)
        if (distance < 25 && distance < minDistance) {
          minDistance = distance;
          closestFlight = flight;
        }
      }
    }

    return closestFlight;
  }

  private findClosestFlightFromEntries(flights: [string, any][], userLocation: Location): any | null {
    if (!flights || flights.length === 0) return null;

    let closestFlight = null;
    let minDistance = Infinity;

    for (const [flightId, flightData] of flights) {
      // FlightRadar24 API returns flight data as arrays: [lat, lng, heading, altitude, speed, ...]
      if (Array.isArray(flightData) && flightData.length >= 2) {
        const [lat, lng] = flightData;
        if (lat && lng) {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            lat,
            lng
          );
          
          // Only consider flights that are reasonably overhead (within 25km)
          if (distance < 25 && distance < minDistance) {
            minDistance = distance;
            closestFlight = { id: flightId, data: flightData };
          }
        }
      }
    }

    return closestFlight;
  }

  private findClosestFlightFromArray(flights: any[], userLocation: Location): any | null {
    if (!flights || flights.length === 0) return null;

    let closestFlight = null;
    let minDistance = Infinity;

    for (const flight of flights) {
      // Check if flight has latitude and longitude
      if (flight.latitude && flight.longitude) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          flight.latitude,
          flight.longitude
        );
        
        // Only consider flights that are reasonably overhead (within 25km)
        if (distance < 25 && distance < minDistance) {
          minDistance = distance;
          closestFlight = flight;
        }
      }
    }

    return closestFlight;
  }

  private findNearbyFlights(flights: any[], userLocation: Location, maxDistanceKm: number): any[] {
    if (!flights || flights.length === 0) return [];

    const nearbyFlights: Array<{flight: any, distance: number}> = [];

    for (const flight of flights) {
      // Use the correct FlightRadar24 property names
      const lat = flight.lat;
      const lng = flight.lon;
      
      if (lat && lng) {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          lat,
          lng
        );
        
        // Consider flights within the specified radius
        if (distance <= maxDistanceKm) {
          nearbyFlights.push({ 
            flight: {
              ...flight,
              // Normalize the coordinate properties for consistent usage
              latitude: lat,
              longitude: lng
            }, 
            distance 
          });
        }
      }
    }

    console.log(`Found ${nearbyFlights.length} flights within ${maxDistanceKm}km radius`);

    // Sort by distance (closest first) and return top 10
    return nearbyFlights
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
      .map(item => ({
        ...item.flight,
        distance: item.distance
      }));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula to calculate distance between two points on Earth
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private parseFlightRadar24Data(rawData: any): FlightData {
    // Parse actual FlightRadar24 API response format
    // FlightRadar24 API returns data as: [lat, lng, heading, altitude, speed, squawk, radar, aircraft_type, registration, timestamp, origin, destination, flight_number, unknown1, unknown2, callsign, unknown3]
    
    const flightData = rawData.data || [];
    const flightId = rawData.id || 'Unknown';
    
    const [lat, lng, heading, altitude, speed, squawk, radar, aircraftType, registration, timestamp, origin, destination, flightNumber, , , callsign] = flightData;
    
    const actualCallsign = callsign || flightNumber || flightId;
    const airline = this.extractAirlineFromCallsign(actualCallsign);
    
    return {
      callsign: actualCallsign,
      airline: airline,
      flightNumber: flightNumber || actualCallsign,
      origin: origin || 'Unknown',
      destination: destination || 'Unknown',
      aircraft: aircraftType || 'Unknown',
      altitude: altitude || 0,
      speed: speed || 0,
      heading: heading || 0,
      latitude: lat || 0,
      longitude: lng || 0,
      status: 'On Time', // FlightRadar24 feed doesn't include status, assume on time
      estimatedArrival: '',
      flightRadarUrl: `https://www.flightradar24.com/${actualCallsign}`
    };
  }

  private parseFlightRadar24LightData(flight: any): FlightData {
    // Parse FlightRadar24 full API response format with richer data
    const callsign = flight.callsign || 'Unknown';
    const flightNumber = flight.flight || callsign;
    
    // Use painted_as for airline code (livery), fallback to operating_as
    const airlineCode = flight.painted_as || flight.operating_as || 
                       this.extractAirlineCodeFromCallsign(callsign);
    
    const airline = this.getAirlineNameFromCode(airlineCode);
    
    // Format ETA if available
    const eta = flight.eta ? new Date(flight.eta).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '';
    
    // Convert speed from knots to mph
    const speedMph = flight.gspeed ? Math.round(flight.gspeed * 1.15078) : 0;
    
    return {
      callsign: callsign,
      airline: airline,
      flightNumber: flightNumber,
      origin: flight.orig_iata || 'Unknown',
      destination: flight.dest_iata || 'Unknown',
      aircraft: flight.type || 'Unknown',
      altitude: flight.alt || 0,
      speed: speedMph,
      heading: flight.track || 0,
      latitude: flight.lat || flight.latitude || 0,
      longitude: flight.lon || flight.longitude || 0,
      status: 'On Time', // FlightRadar24 API doesn't include detailed status
      estimatedArrival: eta,
      flightRadarUrl: `https://www.flightradar24.com/${callsign}`,
      distance: flight.distance || 0,
      airlineCode: airlineCode,
      registration: flight.reg,
      aircraftType: flight.type,
      originIATA: flight.orig_iata,
      destinationIATA: flight.dest_iata,
      eta: eta
    };
  }

  private getAirlineNameFromCode(airlineCode: string): string {
    // Map airline codes to airline names
    const airlineMap: { [key: string]: string } = {
      'UA': 'United Airlines',
      'UAL': 'United Airlines',
      'AC': 'Air Canada',
      'AA': 'American Airlines',
      'AAL': 'American Airlines',
      'DL': 'Delta Air Lines',
      'DAL': 'Delta Air Lines',
      'WN': 'Southwest Airlines',
      'SWA': 'Southwest Airlines',
      'B6': 'JetBlue Airways',
      'JBU': 'JetBlue Airways',
      'AS': 'Alaska Airlines',
      'ASA': 'Alaska Airlines',
      'EK': 'Emirates',
      'UAE': 'Emirates',
      'LH': 'Lufthansa',
      'DLH': 'Lufthansa',
      'BA': 'British Airways',
      'BAW': 'British Airways',
      'AF': 'Air France',
      'AFR': 'Air France',
      'KL': 'KLM',
      'KLM': 'KLM',
      'LX': 'Swiss International',
      'SWR': 'Swiss International',
      'RPA': 'Republic Airways',
      'SKW': 'SkyWest Airlines',
      'WJA': 'WestJet'
    };

    if (!airlineCode) return 'Unknown Airline';
    
    const code = airlineCode.toUpperCase();
    return airlineMap[code] || 'Unknown Airline';
  }

  private extractAirlineFromCallsign(callsign: string): string {
    // Extract airline from callsign (first 2-3 characters usually indicate airline)
    const prefix = callsign.substring(0, 2).toUpperCase();
    return this.getAirlineNameFromCode(prefix);
  }

  private extractAirlineCodeFromCallsign(callsign: string): string {
    // Extract airline code from callsign (first 2-3 characters)
    const match = callsign.match(/^([A-Z]{2,3})/);
    return match ? match[1] : callsign.substring(0, 2).toUpperCase();
  }

  private determineFlightStatus(rawData: any): 'On Time' | 'Delayed' | 'Cancelled' | 'Unknown' {
    if (rawData.status) {
      const status = rawData.status.toLowerCase();
      if (status.includes('cancelled') || status.includes('canceled')) return 'Cancelled';
      if (status.includes('delayed')) return 'Delayed';
      if (status.includes('on time') || status.includes('scheduled')) return 'On Time';
    }
    
    // If no explicit status, assume on time for active flights
    return rawData.altitude > 0 ? 'On Time' : 'Unknown';
  }

  public getLastFlightData(): FlightData[] {
    return this.lastFlightData;
  }

  // Credit usage tracking
  private trackCreditUsage(flightsReturned: number, endpoint: 'full' | 'light'): void {
    // Credit costs per flight based on FlightRadar24 pricing
    const creditCosts = {
      'full': 8,   // Live flight positions - full: 8 credits per flight
      'light': 6   // Live flight positions - light: 6 credits per flight
    };

    const creditsUsed = flightsReturned * creditCosts[endpoint];
    const estimatedCost = creditsUsed * 0.0003; // $0.0003 per credit

    const usage: CreditUsage = {
      creditsUsed,
      flightsReturned,
      endpoint: `live-flight-positions-${endpoint}`,
      timestamp: Date.now(),
      estimatedCost
    };

    this.creditUsageHistory.push(usage);
    
    // Keep only last 100 entries to avoid memory issues
    if (this.creditUsageHistory.length > 100) {
      this.creditUsageHistory = this.creditUsageHistory.slice(-100);
    }

    console.log(`Credit usage: ${creditsUsed} credits for ${flightsReturned} flights (${endpoint} endpoint) - Est. cost: $${estimatedCost.toFixed(4)}`);
  }

  // Settings management
  public getSettings(): FlightServiceSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<FlightServiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('FlightService settings updated:', this.settings);
  }

  // Credit usage analytics
  public getCreditUsageHistory(): CreditUsage[] {
    return [...this.creditUsageHistory];
  }

  public getDailyCreditUsage(): number {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.creditUsageHistory
      .filter(usage => usage.timestamp > oneDayAgo)
      .reduce((total, usage) => total + usage.creditsUsed, 0);
  }

  public getHourlyCreditUsage(): number {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return this.creditUsageHistory
      .filter(usage => usage.timestamp > oneHourAgo)
      .reduce((total, usage) => total + usage.creditsUsed, 0);
  }

  public estimateMonthlyCredits(): number {
    const hourlyUsage = this.getHourlyCreditUsage();
    if (hourlyUsage === 0) {
      // Estimate based on settings if no usage data
      const requestsPerHour = 60 / this.settings.refreshIntervalMinutes;
      const creditsPerRequest = this.settings.maxFlightsPerRequest * (this.settings.useFullEndpoint ? 8 : 6);
      return requestsPerHour * creditsPerRequest * 24 * 30; // 30 days
    }
    return hourlyUsage * 24 * 30; // 30 days
  }

  public getRefreshIntervalMs(): number {
    return this.settings.refreshIntervalMinutes * 60 * 1000;
  }

  public getLastApiError(): ApiError | null {
    return this.lastApiError;
  }

  public clearApiError(): void {
    this.lastApiError = null;
  }
} 