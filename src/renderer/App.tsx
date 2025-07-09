import React, { useState, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';

// TypeScript interface declarations
interface ApiError {
  type: 'payment_required' | 'invalid_key' | 'rate_limit' | 'network' | 'other';
  message: string;
  timestamp: number;
  statusCode?: number;
  details?: string;
}

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
      getCreditUsageHistory: () => Promise<any[]>;
      getDailyCreditUsage: () => Promise<number>;
      getHourlyCreditUsage: () => Promise<number>;
      estimateMonthlyCredits: () => Promise<number>;
      getLastApiError: () => Promise<ApiError | null>;
      clearApiError: () => Promise<void>;
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
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState<'main' | 'settings'>('main');
  const [selectedFlightIndex, setSelectedFlightIndex] = useState(0);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Set up event listeners
    if (window.electronAPI) {
      window.electronAPI.onFlightDataUpdate(async (data: FlightData[]) => {
        setFlightData(data || []);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
        setSelectedFlightIndex(0); // Reset to first flight
        
        // Check for API errors after each update
        const apiError = await window.electronAPI.getLastApiError();
        setApiError(apiError);
      });

      window.electronAPI.onLocationUpdate((loc: Location) => {
        setLocation(loc);
      });

      // Listen for show-settings message from main process
      window.electronAPI.on('show-settings', () => {
        setCurrentPage('settings');
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
      
      // Check for API errors
      const apiError = await window.electronAPI?.getLastApiError();
      setApiError(apiError);
      
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'On Time': return 'flight-status on-time';
      case 'Delayed': return 'flight-status delayed';
      case 'Cancelled': return 'flight-status cancelled';
      default: return 'flight-status unknown';
    }
  };



  const handleFlightNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedFlightIndex(prev => prev > 0 ? prev - 1 : flightData.length - 1);
    } else {
      setSelectedFlightIndex(prev => prev < flightData.length - 1 ? prev + 1 : 0);
    }
  };

  const handleDismissApiError = async () => {
    await window.electronAPI?.clearApiError();
    setApiError(null);
  };

  const getApiErrorIcon = (type: ApiError['type']) => {
    switch (type) {
      case 'payment_required': return '💳';
      case 'invalid_key': return '🔑';
      case 'rate_limit': return '⏱️';
      case 'network': return '🌐';
      default: return '⚠️';
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

  // Render settings page
  if (currentPage === 'settings') {
    return (
      <SettingsPanel 
        onClose={() => setCurrentPage('main')}
      />
    );
  }

  if (!flightData || flightData.length === 0) {
    return (
      <div className="app no-flights">
        {apiError && (
          <div className={`api-error-banner ${apiError.type.replace('_', '-')}`}>
            <div className="api-error-content">
              <div className="api-error-header">
                <span className="api-error-icon">{getApiErrorIcon(apiError.type)}</span>
                <span className="api-error-message">{apiError.message}</span>
                <button 
                  className="api-error-dismiss"
                  onClick={handleDismissApiError}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
              <div className="api-error-details">
                {apiError.details}
              </div>
              {apiError.type === 'payment_required' && (
                <button 
                  className="api-error-action"
                  onClick={() => window.electronAPI?.openExternal('https://fr24api.flightradar24.com')}
                >
                  Top up account
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="no-flights-content">
          <div className="no-flights-icon">🛩️</div>
          <p>{apiError ? 'Unable to fetch flights' : 'No flights nearby'}</p>
          <small className="last-update">{formatLastUpdate()}</small>
        </div>
        
        <div className="app-footer">
          <div className="footer-actions">
            <button 
              className="settings-button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage('settings');
              }}
              title="Settings"
            >
              ⚙️
            </button>
            <small className="app-info">FlightAbove</small>
          </div>
        </div>
        
        {/* Settings are now handled by page navigation */}
      </div>
    );
  }

  const currentFlight = flightData[selectedFlightIndex];

  // Render main page
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
          <div className={getStatusClass(currentFlight.status)}>
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
              setCurrentPage('settings');
            }}
            title="Settings"
          >
            ⚙️
          </button>
          <small className="app-info">FlightAbove</small>
        </div>
      </div>
      
      {/* Settings are now handled by page navigation */}
    </div>
  );
};

export default App; 