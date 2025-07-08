import React, { useState, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';

// TypeScript interface declarations
declare global {
  interface Window {
    electronAPI: {
      getFlightData: () => Promise<FlightData[]>;
      getCurrentLocation: () => Promise<Location>;
      getSettings: () => Promise<any>;
      setSettings: (settings: any) => Promise<void>;
      onFlightDataUpdate: (callback: (data: FlightData[]) => void) => void;
      onLocationUpdate: (callback: (location: Location) => void) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      openExternal: (url: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      setFlightRadar24ApiKey: (apiKey: string) => Promise<{ success: boolean }>;
      getFlightRadar24ApiKey: () => Promise<string | null>;
      hasFlightRadar24ApiKey: () => Promise<boolean>;
      removeFlightRadar24ApiKey: () => Promise<{ success: boolean }>;
      getAllApiKeys: () => Promise<{ flightRadar24: boolean; openSkyNetwork: boolean }>;
      getAirlineLogo: (airlineCode: string) => Promise<string | null>;
    };
  }
}

interface FlightData {
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
  distance?: number;
  airlineCode?: string;
  registration?: string;
  aircraftType?: string;
  originIATA?: string;
  destinationIATA?: string;
  eta?: string;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

// AirlineLogo component with async logo fetching
interface AirlineLogoProps {
  airlineCode?: string;
  airlineName: string;
}

const AirlineLogo: React.FC<AirlineLogoProps> = ({ airlineCode, airlineName }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!airlineCode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const url = await window.electronAPI?.getAirlineLogo(airlineCode);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error fetching airline logo:', error);
        setLogoUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [airlineCode]);

  if (isLoading) {
    return <div className="airline-logo-placeholder">⏳</div>;
  }

  if (!logoUrl) {
    return null;
  }

  return (
    <img 
      src={logoUrl} 
      alt={`${airlineName} logo`}
      className="airline-logo"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

const App: React.FC = () => {
  const [flightData, setFlightData] = useState<FlightData[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFlightIndex, setSelectedFlightIndex] = useState(0);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Set up event listeners
    if (window.electronAPI) {
      window.electronAPI.onFlightDataUpdate((data: FlightData[]) => {
        setFlightData(data || []);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
        setSelectedFlightIndex(0); // Reset to first flight
      });

      window.electronAPI.onLocationUpdate((loc: Location) => {
        setLocation(loc);
      });

      // Listen for show-settings message from main process
      window.electronAPI.on('show-settings', () => {
        setShowSettings(true);
      });
    }

    return () => {
      // Clean up listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('flight-data-update');
        window.electronAPI.removeAllListeners('location-update');
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Get initial location
      const currentLocation = await window.electronAPI?.getCurrentLocation();
      setLocation(currentLocation);
      
      // Get initial flight data
      const initialFlightData = await window.electronAPI?.getFlightData();
      setFlightData(initialFlightData || []);
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize app');
      setLoading(false);
      console.error('App initialization error:', err);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `Updated ${diff}s ago`;
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    return `Updated ${Math.floor(diff / 3600)}h ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return '#22c55e';
      case 'Delayed': return '#f59e0b';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };



  const handleFlightNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedFlightIndex(prev => prev > 0 ? prev - 1 : flightData.length - 1);
    } else {
      setSelectedFlightIndex(prev => prev < flightData.length - 1 ? prev + 1 : 0);
    }
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>Searching for flights nearby...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={initializeApp} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!flightData || flightData.length === 0) {
    return (
      <div className="app no-flights">
        <div className="no-flights-content">
          <div className="no-flights-icon">🛩️</div>
          <p>No flights nearby</p>
          <small className="last-update">{formatLastUpdate()}</small>
        </div>
        
        <div className="app-footer">
          <div className="footer-actions">
            <button 
              className="settings-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
              }}
              title="Settings"
            >
              ⚙️
            </button>
            <small className="app-info">FlightAbove</small>
          </div>
        </div>
        
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  const currentFlight = flightData[selectedFlightIndex];

  return (
    <div className="app">
      {/* Flight Navigation */}
      {flightData.length > 1 && (
        <div className="flight-navigation">
          <button 
            onClick={() => handleFlightNavigation('prev')}
            className="nav-button"
            aria-label="Previous flight"
          >
            ←
          </button>
          <span className="flight-counter">
            {selectedFlightIndex + 1} of {flightData.length}
          </span>
          <button 
            onClick={() => handleFlightNavigation('next')}
            className="nav-button"
            aria-label="Next flight"
          >
            →
          </button>
        </div>
      )}

      <div className="flight-info">
        <div className="flight-header">
          <div className="airline-info">
            <AirlineLogo 
              airlineCode={currentFlight.airlineCode}
              airlineName={currentFlight.airline}
            />
            <div className="airline-text">
              <span className="airline-name">{currentFlight.airline}</span>
              <span className="flight-number">{currentFlight.flightNumber}</span>
            </div>
          </div>
          <div 
            className="flight-status"
            style={{ color: getStatusColor(currentFlight.status) }}
          >
            {currentFlight.status}
          </div>
        </div>
        
        <div className="flight-route">
          <span className="airport origin">{currentFlight.originIATA || currentFlight.origin}</span>
          <span className="route-arrow">→</span>
          <span className="airport destination">{currentFlight.destinationIATA || currentFlight.destination}</span>
        </div>
        
        <div className="flight-details">
          <div className="detail-item">
            <span className="detail-label">Distance:</span>
            <span className="detail-value">
              {currentFlight.distance ? `${currentFlight.distance.toFixed(1)}km` : 'Unknown'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Altitude:</span>
            <span className="detail-value">{currentFlight.altitude.toLocaleString()}ft</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Speed:</span>
            <span className="detail-value">{currentFlight.speed} mph</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Aircraft:</span>
            <span className="detail-value">{currentFlight.aircraftType || currentFlight.aircraft}</span>
          </div>
          {currentFlight.registration && (
            <div className="detail-item">
              <span className="detail-label">Registration:</span>
              <span className="detail-value">{currentFlight.registration}</span>
            </div>
          )}
          {currentFlight.eta && (
            <div className="detail-item">
              <span className="detail-label">ETA:</span>
              <span className="detail-value">{currentFlight.eta}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="app-footer">
        <small className="last-update">{formatLastUpdate()}</small>
        <div className="footer-actions">
          <button 
            className="settings-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
            title="Settings"
          >
            ⚙️
          </button>
          <small className="app-info">FlightAbove</small>
        </div>
      </div>
      
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default App; 