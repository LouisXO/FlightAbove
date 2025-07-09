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
  
  // Credit usage and settings states
  const [creditUsage, setCreditUsage] = useState({
    daily: 0,
    hourly: 0,
    monthly: 0,
    history: [] as any[]
  });
  const [settings, setSettings] = useState({
    refreshIntervalMinutes: 30,
    maxFlightsPerRequest: 1,
    radiusKm: 20,
    useFullEndpoint: true,
    demoMode: false
  });

  useEffect(() => {
    loadApiKeyStatus();
    loadCreditUsage();
    loadSettings();
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

  const loadCreditUsage = async () => {
    try {
      const daily = await window.electronAPI?.getDailyCreditUsage();
      const hourly = await window.electronAPI?.getHourlyCreditUsage();
      const monthly = await window.electronAPI?.estimateMonthlyCredits();
      const history = await window.electronAPI?.getCreditUsageHistory();
      
      setCreditUsage({
        daily: daily || 0,
        hourly: hourly || 0,
        monthly: monthly || 0,
        history: history || []
      });
    } catch (error) {
      console.error('Error loading credit usage:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const currentSettings = await window.electronAPI?.getSettings();
      if (currentSettings) {
        setSettings({
          refreshIntervalMinutes: currentSettings.refreshIntervalMinutes || 30,
          maxFlightsPerRequest: currentSettings.maxFlightsPerRequest || 1,
          radiusKm: currentSettings.radiusKm || 20,
          useFullEndpoint: currentSettings.useFullEndpoint || true,
          demoMode: currentSettings.demoMode || false
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await window.electronAPI?.setSettings(settings);
      setMessage('✅ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Reload credit usage to reflect new settings
      loadCreditUsage();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoModeToggle = async (enabled: boolean) => {
    const newSettings = { ...settings, demoMode: enabled };
    setSettings(newSettings);
    
    // Automatically save the demo mode setting
    try {
      await window.electronAPI?.setSettings(newSettings);
      setMessage(enabled ? '🎮 Demo mode enabled! Generating realistic flight data...' : '🔴 Demo mode disabled');
      setTimeout(() => setMessage(''), 3000);
      
      // Reload credit usage to reflect new settings
      loadCreditUsage();
    } catch (error) {
      console.error('Error saving demo mode:', error);
      setMessage('❌ Failed to save demo mode setting');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getPlanRecommendation = (monthlyCredits: number) => {
    if (monthlyCredits <= 60000) {
      return { plan: 'Explorer', cost: '$9/month', color: '#22c55e' };
    } else if (monthlyCredits <= 660000) {
      return { plan: 'Essential', cost: '$90/month', color: '#f59e0b' };
    } else {
      return { plan: 'Advanced', cost: '$900/month', color: '#ef4444' };
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-button" onClick={onClose}>← Back</button>
        <h2>⚙️ FlightAbove Settings</h2>
        <div className="header-spacer"></div>
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
                {isLoading ? '💾 Saving...' : '💾  Save API Key'}
              </button>
              
              {hasApiKey && (
                <button
                  className="remove-button"
                  onClick={handleRemoveApiKey}
                  disabled={isLoading}
                >
                  🗑️  Remove API Key
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
            <h3>🎮 Demo Mode</h3>
            <p className="setting-description">
              Enable demo mode to showcase the app with simulated flight data and credit usage tracking without needing a real API key.
            </p>
            
            <div className="demo-mode-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.demoMode}
                  onChange={(e) => handleDemoModeToggle(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {settings.demoMode ? '🟢 Demo Mode Enabled' : '🔴 Demo Mode Disabled'}
                </span>
              </label>
            </div>
            
            {settings.demoMode && (
              <div className="demo-mode-info">
                <p>
                  <strong>Demo mode is active:</strong> The app will generate realistic flight data and 
                  simulate credit usage patterns. Perfect for testing and showcasing features.
                </p>
                <p>
                  <small>💡 Demo flights update according to your refresh settings and show realistic data including airlines, routes, and aircraft types.</small>
                </p>
              </div>
            )}
          </div>

          {(hasApiKey || settings.demoMode) && (
            <div className="setting-section">
              <h3>💳 Credit Usage & Analytics</h3>
              <div className="credit-usage-grid">
                <div className="credit-card">
                  <h4>Last Hour</h4>
                  <div className="credit-value">{creditUsage.hourly}</div>
                  <div className="credit-label">credits</div>
                </div>
                <div className="credit-card">
                  <h4>Today</h4>
                  <div className="credit-value">{creditUsage.daily}</div>
                  <div className="credit-label">credits</div>
                </div>
                <div className="credit-card">
                  <h4>Est. Monthly</h4>
                  <div className="credit-value">{creditUsage.monthly.toLocaleString()}</div>
                  <div className="credit-label">credits</div>
                </div>
              </div>
              
              {creditUsage.monthly > 0 && (
                <div className="plan-recommendation">
                  <h4>💡 Recommended Plan</h4>
                  <div className="plan-info" style={{ borderColor: getPlanRecommendation(creditUsage.monthly).color }}>
                    <strong>{getPlanRecommendation(creditUsage.monthly).plan}</strong> - {getPlanRecommendation(creditUsage.monthly).cost}
                    <br />
                    <small>Based on your estimated monthly usage of {creditUsage.monthly.toLocaleString()} credits</small>
                  </div>
                </div>
              )}
            </div>
          )}

          {(hasApiKey || settings.demoMode) && (
            <div className="setting-section">
              <h3>⚙️ Credit Optimization Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Refresh Interval</label>
                  <select 
                    value={settings.refreshIntervalMinutes} 
                    onChange={(e) => setSettings({...settings, refreshIntervalMinutes: parseInt(e.target.value)})}
                  >
                    <option value={5}>5 minutes (high usage)</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes (recommended)</option>
                    <option value={60}>60 minutes (low usage)</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>Max Flights Per Request</label>
                  <select 
                    value={settings.maxFlightsPerRequest} 
                    onChange={(e) => setSettings({...settings, maxFlightsPerRequest: parseInt(e.target.value)})}
                  >
                    <option value={1}>1 flight (recommended)</option>
                    <option value={3}>3 flights</option>
                    <option value={5}>5 flights</option>
                    <option value={10}>10 flights</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>Search Radius</label>
                  <select 
                    value={settings.radiusKm} 
                    onChange={(e) => setSettings({...settings, radiusKm: parseInt(e.target.value)})}
                  >
                    <option value={20}>20 km (recommended)</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                    <option value={200}>200 km</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>API Endpoint</label>
                  <select 
                    value={settings.useFullEndpoint ? 'full' : 'light'} 
                    onChange={(e) => setSettings({...settings, useFullEndpoint: e.target.value === 'full'})}
                  >
                    <option value="light">Light (6 credits/flight)</option>
                    <option value="full">Full (8 credits/flight) - recommended</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-impact">
                <h4>💰 Credit Usage Impact</h4>
                <p>
                  With current settings: ~{Math.round((60 / settings.refreshIntervalMinutes) * settings.maxFlightsPerRequest * (settings.useFullEndpoint ? 8 : 6))} credits/hour
                  <br />
                  <small>Est. {Math.round((60 / settings.refreshIntervalMinutes) * settings.maxFlightsPerRequest * (settings.useFullEndpoint ? 8 : 6) * 24 * 30).toLocaleString()} credits/month</small>
                </p>
              </div>
              
              <button 
                className="save-button"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? '💾 Saving...' : '💾 Save Settings'}
              </button>
            </div>
          )}

          <div className="setting-section">
            <h3>📖 How to Get Your API Key</h3>
            <ol className="instructions">
              <li>Visit <a href="#" onClick={() => window.electronAPI?.openExternal('https://fr24api.flightradar24.com')}>FlightRadar24 API Website</a></li>
              <li>Create an account or log in to your existing account</li>
              <li>Choose a subscription plan (Explorer, Essential, or Advanced)</li>
              <li>Go to your dashboard and find "API Keys" or "Access Tokens"</li>
              <li>Copy your API key and paste it in the field above</li>
              <li>Click "Save API Key" to start using real flight data</li>
            </ol>
            
            <div className="api-note">
              <p><strong>Note:</strong> The app now uses ultra-conservative settings by default (30-minute intervals, 1 flight max, 20km radius, full endpoint) optimized for 60,000+ credit plans. These settings use approximately 11,520 credits per month.</p>
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
  );
};

export default SettingsPanel; 