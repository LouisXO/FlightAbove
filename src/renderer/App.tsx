import React, { useState, useEffect } from 'react';
import './App.css';

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
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const App: React.FC = () => {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Set up event listeners
    if (window.electronAPI) {
      window.electronAPI.onFlightDataUpdate((data: FlightData) => {
        setFlightData(data);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
      });

      window.electronAPI.onLocationUpdate((loc: Location) => {
        setLocation(loc);
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
      setFlightData(initialFlightData);
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize app');
      setLoading(false);
      console.error('App initialization error:', err);
    }
  };

  const handleFlightClick = () => {
    if (flightData?.flightRadarUrl) {
      window.electronAPI?.openExternal(flightData.flightRadarUrl);
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

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>Searching for flights overhead...</p>
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

  if (!flightData) {
    return (
      <div className="app no-flights">
        <div className="no-flights-icon">🛩️</div>
        <p>No flights overhead</p>
        <small className="last-update">{formatLastUpdate()}</small>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="flight-info" onClick={handleFlightClick}>
        <div className="flight-header">
          <div className="airline-info">
            <span className="airline-name">{flightData.airline}</span>
            <span className="flight-number">{flightData.flightNumber}</span>
          </div>
          <div 
            className="flight-status"
            style={{ color: getStatusColor(flightData.status) }}
          >
            {flightData.status}
          </div>
        </div>
        
        <div className="flight-route">
          <span className="airport origin">{flightData.origin}</span>
          <span className="route-arrow">→</span>
          <span className="airport destination">{flightData.destination}</span>
        </div>
        
        <div className="flight-details">
          <div className="detail-item">
            <span className="detail-label">Altitude:</span>
            <span className="detail-value">{flightData.altitude.toLocaleString()}ft</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Speed:</span>
            <span className="detail-value">{flightData.speed} mph</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Aircraft:</span>
            <span className="detail-value">{flightData.aircraft}</span>
          </div>
        </div>
      </div>
      
      <div className="app-footer">
        <small className="last-update">{formatLastUpdate()}</small>
        <small className="click-hint">Click for details</small>
      </div>
    </div>
  );
};

export default App; 