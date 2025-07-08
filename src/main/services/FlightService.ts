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

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class FlightService {
  private static instance: FlightService;
  private lastFlightData: FlightData[] = []; // Changed to array
  private apiKeyManager: ApiKeyManager;
  private mockFlights: FlightData[] = [
    {
      callsign: 'UAL1234',
      airline: 'United Airlines',
      flightNumber: 'UA1234',
      origin: 'LAX',
      destination: 'JFK',
      aircraft: 'Boeing 737-800',
      altitude: 35000,
      speed: 580,
      heading: 85,
      latitude: 37.7749,
      longitude: -122.4194,
      status: 'On Time',
      estimatedArrival: '2024-01-15T18:30:00Z',
      flightRadarUrl: 'https://www.flightradar24.com/UAL1234'
    },
    {
      callsign: 'AAL5678',
      airline: 'American Airlines',
      flightNumber: 'AA5678',
      origin: 'DFW',
      destination: 'ORD',
      aircraft: 'Airbus A320',
      altitude: 32000,
      speed: 520,
      heading: 45,
      latitude: 32.8968,
      longitude: -97.0380,
      status: 'Delayed',
      estimatedArrival: '2024-01-15T19:45:00Z',
      flightRadarUrl: 'https://www.flightradar24.com/AAL5678'
    },
    {
      callsign: 'DAL9876',
      airline: 'Delta Air Lines',
      flightNumber: 'DL9876',
      origin: 'ATL',
      destination: 'SEA',
      aircraft: 'Boeing 757-200',
      altitude: 38000,
      speed: 600,
      heading: 315,
      latitude: 33.6407,
      longitude: -84.4277,
      status: 'On Time',
      estimatedArrival: '2024-01-15T21:15:00Z',
      flightRadarUrl: 'https://www.flightradar24.com/DAL9876'
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
      // Check if we have an API key first
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

  public async getFlightsInArea(location: Location, radiusKm: number = 50): Promise<FlightData[]> {
    try {
      // TODO: Implement actual API call to get flights in area
      // This would typically call FlightRadar24 API or similar
      return this.mockFlights.filter(() => Math.random() < 0.7); // Random subset
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

      // FlightRadar24 API endpoint for flights in a specific area
      const response = await axios.get('https://fr24api.flightradar24.com/api/live/flight-positions/full', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Accept-Version': 'v1'
        },
        params: {
          // Create a larger bounding box around the user's location (approximately 100km radius)
          // Format: 'north,south,west,east' coordinates
          bounds: `${location.latitude + 0.9},${location.latitude - 0.9},${location.longitude - 0.9},${location.longitude + 0.9}`
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('FlightRadar24 API response received');
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // FlightRadar24 live flight positions API returns an array of flights
        const flights = response.data.data;
        
        console.log(`Found ${flights.length} flights in the area`);
        
        if (flights.length > 0) {
          // Debug: log the first flight to see the data structure
          console.log('Sample flight data structure:', JSON.stringify(flights[0], null, 2));
          
          // Find all nearby flights (within 100km) and sort by distance
          const nearbyFlights = this.findNearbyFlights(flights, location, 100);
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
      console.error('FlightRadar24 API error:', error);
      
      // Check if it's an axios error with response
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        
        console.error(`FlightRadar24 API HTTP Error: ${status} ${statusText}`);
        
        if (status === 401) {
          console.error('FlightRadar24 API key is invalid or expired');
        } else if (status === 403) {
          console.error('FlightRadar24 API key does not have permission for this endpoint');
        } else if (status === 404) {
          console.error('FlightRadar24 API endpoint not found - the API URL may be incorrect');
        } else if (status === 429) {
          console.error('FlightRadar24 API rate limit exceeded');
        } else {
          console.error('FlightRadar24 API returned an unexpected error');
        }
        
        // Log response data for debugging
        if (error.response?.data) {
          console.error('API Response:', error.response.data);
        }
      } else {
        console.error('Network or other error:', error);
      }
      
      throw error;
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
} 