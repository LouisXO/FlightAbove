import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [flightRadar24ApiKey, setFlightRadar24ApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadApiKeyStatus();
  }, []);

  const loadApiKeyStatus = async () => {
    try {
      const hasKey = await window.electronAPI?.hasFlightRadar24ApiKey();
      setHasApiKey(hasKey || false);
      
      if (hasKey) {
        const apiKey = await window.electronAPI?.getFlightRadar24ApiKey();
        if (apiKey) {
          setFlightRadar24ApiKey(apiKey);
        }
      }
    } catch (error) {
      console.error('Error loading API key status:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!flightRadar24ApiKey.trim()) {
      setMessage('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await window.electronAPI?.setFlightRadar24ApiKey(flightRadar24ApiKey.trim());
      setHasApiKey(true);
      setMessage('✅ API key saved successfully! Real flight data will now be used.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage('❌ Failed to save API key');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await window.electronAPI?.removeFlightRadar24ApiKey();
      setFlightRadar24ApiKey('');
      setHasApiKey(false);
      setMessage('🗑️ API key removed. Using mock data.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing API key:', error);
      setMessage('❌ Failed to remove API key');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>⚙️ FlightAbove Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="settings-content">
          <div className="setting-section">
            <h3>🔑 FlightRadar24 API Configuration</h3>
            <p className="setting-description">
              Enter your FlightRadar24 API key to get real flight data instead of mock data.
            </p>
            
            <div className="api-key-status">
              <span className={`status-indicator ${hasApiKey ? 'active' : 'inactive'}`}>
                {hasApiKey ? '🟢 Active' : '🔴 Inactive'}
              </span>
              <span className="status-text">
                {hasApiKey ? 'Using real flight data from FlightRadar24' : 'No flights shown - add API key to see real flights overhead'}
              </span>
            </div>

            <div className="input-group">
              <label htmlFor="flightradar24-key">API Key:</label>
              <div className="password-input">
                <input
                  id="flightradar24-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={flightRadar24ApiKey}
                  onChange={(e) => setFlightRadar24ApiKey(e.target.value)}
                  placeholder="Enter your FlightRadar24 API key"
                  className="api-key-input"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="button-group">
              <button
                className="save-button"
                onClick={handleSaveApiKey}
                disabled={isLoading || !flightRadar24ApiKey.trim()}
              >
                {isLoading ? '💾 Saving...' : '💾 Save API Key'}
              </button>
              
              {hasApiKey && (
                <button
                  className="remove-button"
                  onClick={handleRemoveApiKey}
                  disabled={isLoading}
                >
                  🗑️ Remove API Key
                </button>
              )}
            </div>

            {message && (
              <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
          </div>

          <div className="setting-section">
            <h3>📖 How to Get Your API Key</h3>
            <ol className="instructions">
              <li>Visit <a href="#" onClick={() => window.electronAPI?.openExternal('https://fr24api.flightradar24.com')}>FlightRadar24 API Website</a></li>
              <li>Create an account or log in to your existing account</li>
              <li>Choose a subscription plan (Free, Basic, or Pro)</li>
              <li>Go to your dashboard and find "API Keys" or "Access Tokens"</li>
              <li>Copy your API key and paste it in the field above</li>
              <li>Click "Save API Key" to start using real flight data</li>
            </ol>
            
            <div className="api-note">
              <p><strong>Note:</strong> If you're getting a 404 error, the API endpoint may have changed. Please check the FlightRadar24 API documentation for the latest endpoints.</p>
            </div>
          </div>

          <div className="setting-section">
            <h3>ℹ️ About</h3>
            <p>FlightAbove v1.0.0</p>
            <p>A macOS menu bar app for tracking flights overhead.</p>
            <p>
              <a href="#" onClick={() => window.electronAPI?.openExternal('https://github.com/LouisXO/FlightAbove')}>
                📂 View on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 