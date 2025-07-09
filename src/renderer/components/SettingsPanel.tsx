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
    refreshIntervalMinutes: 5,
    maxFlightsPerRequest: 10,
    radiusKm: 15,
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
          refreshIntervalMinutes: currentSettings.refreshIntervalMinutes || 5,
          maxFlightsPerRequest: currentSettings.maxFlightsPerRequest || 10,
          radiusKm: currentSettings.radiusKm || 15,
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
          {/* API Key section hidden - using unofficial API that doesn't require keys
          <div className="setting-section">
            <h3>🔑 FlightRadar24 API Configuration</h3>
            <p className="setting-description">
              Enter your FlightRadar24 API key to get real flight data instead of mock data.
            </p>
            ...
          </div>
          */}

          <div className="setting-section">
            <h3>🛫 Flight Data Source</h3>
            <p className="setting-description">
              FlightAbove uses real-time flight data by default. Enable demo mode to showcase the app with simulated flight scenarios and test different settings.
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

          <div className="setting-section">
            <h3>📊 Usage Analytics</h3>
              <div className="credit-usage-grid">
                <div className="credit-card">
                  <h4>Last Hour</h4>
                  <div className="credit-value">{creditUsage.hourly}</div>
                  <div className="credit-label">requests</div>
                </div>
                <div className="credit-card">
                  <h4>Today</h4>
                  <div className="credit-value">{creditUsage.daily}</div>
                  <div className="credit-label">requests</div>
                </div>
                <div className="credit-card">
                  <h4>Est. Monthly</h4>
                  <div className="credit-value">{creditUsage.monthly.toLocaleString()}</div>
                  <div className="credit-label">requests</div>
                </div>
              </div>

            </div>
          
          <div className="setting-section">
            <h3>⚙️ Flight Tracking Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Refresh Interval</label>
                  <select 
                    value={settings.refreshIntervalMinutes} 
                    onChange={(e) => setSettings({...settings, refreshIntervalMinutes: parseInt(e.target.value)})}
                  >
                    <option value={1}>1 minute (very high usage)</option>
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
                    <option value={10}>10 km (close range)</option>
                    <option value={15}>15 km (recommended for visible aircraft)</option>
                    <option value={25}>25 km (extended range)</option>
                    <option value={50}>50 km (wide area)</option>
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
                <h4>📡 Update Frequency</h4>
                <p>
                  With current settings: ~{Math.round(60 / settings.refreshIntervalMinutes)} updates/hour
                  <br />
                  <small>Tracking up to {settings.maxFlightsPerRequest} flights within {settings.radiusKm}km every {settings.refreshIntervalMinutes} minute{settings.refreshIntervalMinutes > 1 ? 's' : ''}</small>
                </p>
                {settings.refreshIntervalMinutes === 1 && (
                  <div className="usage-warning">
                    <strong>⚠️ High Usage Warning:</strong> 1-minute refresh will update very frequently. 
                    This is great for real-time tracking but may consume significant system resources.
                  </div>
                )}
                {settings.refreshIntervalMinutes <= 5 && (
                  <div className="usage-info">
                    <strong>💡 Tip:</strong> Frequent updates provide more real-time data but use more resources. 
                    Consider using 10-30 minutes for normal usage.
                  </div>
                )}
              </div>
              
              <button 
                className="save-button"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? '💾 Saving...' : '💾 Save Settings'}
              </button>
            </div>

          <div className="setting-section">
            <h3>✈️ About Flight Visibility</h3>
            <p className="setting-description">
              Optimize your settings for the best aircraft spotting experience based on visibility ranges and tracking preferences.
            </p>
            
            <div className="visibility-section">
              <h4 className="visibility-header">🎯 Optimal Settings for Spotting Aircraft</h4>
              <div className="visibility-grid">
                <div className="visibility-card">
                  <div className="visibility-icon">📍</div>
                  <div className="visibility-content">
                    <h5>15km radius</h5>
                    <p>Perfect for aircraft you can actually see overhead</p>
                  </div>
                </div>
                <div className="visibility-card">
                  <div className="visibility-icon">⏱️</div>
                  <div className="visibility-content">
                    <h5>5-minute updates</h5>
                    <p>Keep track of fast-moving aircraft</p>
                  </div>
                </div>
                <div className="visibility-card">
                  <div className="visibility-icon">🎛️</div>
                  <div className="visibility-content">
                    <h5>10 flights max</h5>
                    <p>See all nearby traffic without clutter</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="visibility-section">
              <h4 className="visibility-header">👁️ Visibility Guidelines</h4>
              <div className="visibility-ranges">
                <div className="range-item">
                  <div className="range-icon">🛩️</div>
                  <div className="range-info">
                    <div className="range-distance">10-15km</div>
                    <div className="range-description">Commercial aircraft clearly visible at cruise altitude</div>
                  </div>
                </div>
                <div className="range-item">
                  <div className="range-icon">🚁</div>
                  <div className="range-info">
                    <div className="range-distance">5-10km</div>
                    <div className="range-description">Lower altitude traffic (helicopters, small aircraft)</div>
                  </div>
                </div>
                <div className="range-item">
                  <div className="range-icon">✈️</div>
                  <div className="range-info">
                    <div className="range-distance">25km+</div>
                    <div className="range-description">Extended tracking for approaching/departing aircraft</div>
                  </div>
                </div>
              </div>
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