import axios from 'axios';

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
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class FlightService {
  private static instance: FlightService;
  private lastFlightData: FlightData | null = null;
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

  private constructor() {}

  public async getFlightData(location: Location): Promise<FlightData | null> {
    try {
      // TODO: Replace with actual API call
      // For now, return mock data
      return this.getMockFlightData(location);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      return null;
    }
  }

  private getMockFlightData(location: Location): FlightData | null {
    // Simulate finding a flight "overhead" based on location
    // In a real implementation, this would filter flights by proximity
    const randomFlight = this.mockFlights[Math.floor(Math.random() * this.mockFlights.length)];
    
    // Simulate some flights not being overhead
    if (Math.random() < 0.3) {
      return null; // No flights overhead
    }

    this.lastFlightData = {
      ...randomFlight,
      latitude: location.latitude + (Math.random() - 0.5) * 0.1,
      longitude: location.longitude + (Math.random() - 0.5) * 0.1,
    };

    return this.lastFlightData;
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

  private async callFlightRadar24API(location: Location): Promise<FlightData[]> {
    // TODO: Implement actual FlightRadar24 API call
    // This would require API key and proper authentication
    const response = await axios.get('https://api.flightradar24.com/flights', {
      params: {
        lat: location.latitude,
        lng: location.longitude,
        radius: 50 // km
      }
    });

    return response.data.flights.map(this.parseFlightData);
  }

  private parseFlightData(rawData: any): FlightData {
    // TODO: Parse actual API response format
    return {
      callsign: rawData.callsign || 'Unknown',
      airline: rawData.airline || 'Unknown',
      flightNumber: rawData.flight || 'Unknown',
      origin: rawData.origin || 'Unknown',
      destination: rawData.destination || 'Unknown',
      aircraft: rawData.aircraft || 'Unknown',
      altitude: rawData.altitude || 0,
      speed: rawData.speed || 0,
      heading: rawData.heading || 0,
      latitude: rawData.lat || 0,
      longitude: rawData.lng || 0,
      status: rawData.status || 'Unknown',
      estimatedArrival: rawData.eta || '',
      flightRadarUrl: `https://www.flightradar24.com/${rawData.callsign}`
    };
  }

  public getLastFlightData(): FlightData | null {
    return this.lastFlightData;
  }
} 