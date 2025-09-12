/**
 * EEA-Compliant Consent Management System
 * Handles cookie consent, privacy preferences, and GTM integration
 */

class ConsentManager {
    constructor(options = {}) {
        this.options = {
            storageKey: 'motel_consent_preferences',
            consentVersion: '1.0',
            defaultConsent: {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted'
            },
            bannerDelay: 1000,
            autoShowBanner: true,
            ...options
        };
        
        this.consentGiven = false;
        this.preferences = null;
        this.bannerShown = false;
        
        this.init();
    }
    
    init() {
        this.loadStoredPreferences();
        this.setDefaultConsent();
        
        if (this.shouldShowBanner()) {
            this.showConsentBanner();
        } else {
            this.applyStoredConsent();
        }
        
        this.setupEventListeners();
    }
    
    // Check if we need to show the consent banner
    shouldShowBanner() {
        if (!this.options.autoShowBanner) return false;
        
        // Show banner if no preferences stored or version mismatch
        if (!this.preferences || this.preferences.version !== this.options.consentVersion) {
            return true;
        }
        
        // Show banner if in EEA region (simplified check)
        if (this.isEEARegion()) {
            return !this.preferences.consentGiven;
        }
        
        return false;
    }
    
    // Simplified EEA region detection
    isEEARegion() {
        // In a real implementation, you would use a proper geolocation service
        // This is a simplified check based on timezone and language
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language.toLowerCase();
        
        const eeaTimezones = [
            'europe/london', 'europe/paris', 'europe/berlin', 'europe/rome',
            'europe/madrid', 'europe/amsterdam', 'europe/brussels', 'europe/vienna',
            'europe/stockholm', 'europe/copenhagen', 'europe/helsinki', 'europe/oslo',
            'europe/dublin', 'europe/lisbon', 'europe/athens', 'europe/warsaw',
            'europe/prague', 'europe/budapest', 'europe/bucharest', 'europe/sofia',
            'europe/zagreb', 'europe/ljubljana', 'europe/bratislava', 'europe/vilnius',
            'europe/riga', 'europe/tallinn', 'europe/malta', 'europe/nicosia'
        ];
        
        const eeaLanguages = [
            'en-gb', 'fr', 'de', 'it', 'es', 'nl', 'pt', 'el', 'pl', 'cs',
            'hu', 'ro', 'bg', 'hr', 'sl', 'sk', 'lt', 'lv', 'et', 'mt', 'fi',
            'sv', 'da', 'no'
        ];
        
        return eeaTimezones.includes(timezone.toLowerCase()) || 
               eeaLanguages.some(lang => language.startsWith(lang));
    }
    
    // Set default consent state in GTM
    setDefaultConsent() {
        if (typeof gtag === 'function') {
            gtag('consent', 'default', {
                ...this.options.defaultConsent,
                wait_for_update: 500
            });
        }
    }
    
    // Load stored consent preferences
    loadStoredPreferences() {
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (stored) {
                this.preferences = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load consent preferences:', error);
            this.preferences = null;
        }
    }
    
    // Save consent preferences to storage
    savePreferences(preferences) {
        try {
            const toStore = {
                ...preferences,
                version: this.options.consentVersion,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                domain: window.location.hostname
            };
            
            localStorage.setItem(this.options.storageKey, JSON.stringify(toStore));
            this.preferences = toStore;
        } catch (error) {
            console.warn('Failed to save consent preferences:', error);
        }
    }
    
    // Apply stored consent to GTM
    applyStoredConsent() {
        if (this.preferences && this.preferences.consentGiven) {
            const consentUpdate = {
                analytics_storage: this.preferences.analytics ? 'granted' : 'denied',
                ad_storage: this.preferences.advertising ? 'granted' : 'denied'
            };
            
            if (typeof gtag === 'function') {
                gtag('consent', 'update', consentUpdate);
            }
            
            this.consentGiven = true;
            this.trackConsentEvent('consent_restored', this.preferences);
        }
    }
    
    // Show the consent banner
    showConsentBanner() {
        if (this.bannerShown) return;
        
        setTimeout(() => {
            const banner = document.getElementById('consentBanner');
            if (banner) {
                banner.style.display = 'block';
                this.bannerShown = true;
                this.trackConsentEvent('consent_banner_shown');
            }
        }, this.options.bannerDelay);
    }
    
    // Hide the consent banner
    hideConsentBanner() {
        const banner = document.getElementById('consentBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    // Accept all cookies
    acceptAll() {
        const preferences = {
            consentGiven: true,
            analytics: true,
            advertising: true,
            functional: true,
            necessary: true
        };
        
        this.savePreferences(preferences);
        this.updateGTMConsent(preferences);
        this.hideConsentBanner();
        this.consentGiven = true;
        
        this.trackConsentEvent('consent_accepted_all', preferences);
    }
    
    // Decline all non-necessary cookies
    declineAll() {
        const preferences = {
            consentGiven: true,
            analytics: false,
            advertising: false,
            functional: true,
            necessary: true
        };
        
        this.savePreferences(preferences);
        this.updateGTMConsent(preferences);
        this.hideConsentBanner();
        this.consentGiven = true;
        
        this.trackConsentEvent('consent_declined_all', preferences);
    }
    
    // Show detailed preferences modal
    showPreferences() {
        this.createPreferencesModal();
        this.trackConsentEvent('consent_preferences_opened');
    }
    
    // Update GTM consent based on preferences
    updateGTMConsent(preferences) {
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                analytics_storage: preferences.analytics ? 'granted' : 'denied',
                ad_storage: preferences.advertising ? 'granted' : 'denied'
            });
        }
    }
    
    // Create detailed preferences modal
    createPreferencesModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('consentPreferencesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'consentPreferencesModal';
        modal.innerHTML = `
            <div class="consent-modal-overlay">
                <div class="consent-modal">
                    <div class="consent-modal-header">
                        <h2>Privacy Preferences</h2>
                        <button class="consent-modal-close" onclick="consentManager.closePreferences()">&times;</button>
                    </div>
                    <div class="consent-modal-body">
                        <p>We use cookies and similar technologies to enhance your experience, analyze site usage, and assist in marketing efforts. You can manage your preferences below:</p>
                        
                        <div class="consent-category">
                            <div class="consent-category-header">
                                <h3>Necessary Cookies</h3>
                                <label class="consent-toggle">
                                    <input type="checkbox" checked disabled>
                                    <span class="consent-slider"></span>
                                </label>
                            </div>
                            <p>These cookies are essential for the website to function properly. They cannot be disabled.</p>
                        </div>
                        
                        <div class="consent-category">
                            <div class="consent-category-header">
                                <h3>Analytics Cookies</h3>
                                <label class="consent-toggle">
                                    <input type="checkbox" id="analyticsToggle" ${this.preferences?.analytics ? 'checked' : ''}>
                                    <span class="consent-slider"></span>
                                </label>
                            </div>
                            <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                        </div>
                        
                        <div class="consent-category">
                            <div class="consent-category-header">
                                <h3>Advertising Cookies</h3>
                                <label class="consent-toggle">
                                    <input type="checkbox" id="advertisingToggle" ${this.preferences?.advertising ? 'checked' : ''}>
                                    <span class="consent-slider"></span>
                                </label>
                            </div>
                            <p>These cookies are used to make advertising messages more relevant to you and your interests.</p>
                        </div>
                        
                        <div class="consent-category">
                            <div class="consent-category-header">
                                <h3>Functional Cookies</h3>
                                <label class="consent-toggle">
                                    <input type="checkbox" id="functionalToggle" ${this.preferences?.functional !== false ? 'checked' : ''}>
                                    <span class="consent-slider"></span>
                                </label>
                            </div>
                            <p>These cookies enable enhanced functionality and personalization, such as remembering your preferences.</p>
                        </div>
                    </div>
                    <div class="consent-modal-footer">
                        <button class="consent-btn consent-btn-secondary" onclick="consentManager.closePreferences()">Cancel</button>
                        <button class="consent-btn consent-btn-primary" onclick="consentManager.saveDetailedPreferences()">Save Preferences</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .consent-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .consent-modal {
                background: white;
                border-radius: 10px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .consent-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }
            
            .consent-modal-header h2 {
                margin: 0;
                color: #2c3e50;
            }
            
            .consent-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .consent-modal-close:hover {
                color: #333;
            }
            
            .consent-modal-body {
                padding: 20px;
            }
            
            .consent-category {
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .consent-category:last-child {
                border-bottom: none;
            }
            
            .consent-category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .consent-category h3 {
                margin: 0;
                color: #2c3e50;
                font-size: 1.1rem;
            }
            
            .consent-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .consent-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .consent-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .consent-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .consent-slider {
                background-color: #27ae60;
            }
            
            input:disabled + .consent-slider {
                background-color: #27ae60;
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            input:checked + .consent-slider:before {
                transform: translateX(26px);
            }
            
            .consent-modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .consent-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .consent-btn-primary {
                background: #27ae60;
                color: white;
            }
            
            .consent-btn-primary:hover {
                background: #219a52;
            }
            
            .consent-btn-secondary {
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
            }
            
            .consent-btn-secondary:hover {
                background: #f5f5f5;
            }
        `;
        
        modal.appendChild(style);
        document.body.appendChild(modal);
    }
    
    // Close preferences modal
    closePreferences() {
        const modal = document.getElementById('consentPreferencesModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Save detailed preferences from modal
    saveDetailedPreferences() {
        const analytics = document.getElementById('analyticsToggle')?.checked || false;
        const advertising = document.getElementById('advertisingToggle')?.checked || false;
        const functional = document.getElementById('functionalToggle')?.checked || false;
        
        const preferences = {
            consentGiven: true,
            analytics,
            advertising,
            functional,
            necessary: true
        };
        
        this.savePreferences(preferences);
        this.updateGTMConsent(preferences);
        this.hideConsentBanner();
        this.closePreferences();
        this.consentGiven = true;
        
        this.trackConsentEvent('consent_preferences_saved', preferences);
    }
    
    // Track consent-related events
    trackConsentEvent(eventName, data = {}) {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                event_category: 'consent',
                consent_version: this.options.consentVersion,
                is_eea_region: this.isEEARegion(),
                ...data
            });
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Listen for consent banner interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.consent-accept')) {
                this.acceptAll();
            } else if (e.target.matches('.consent-decline')) {
                this.declineAll();
            } else if (e.target.matches('.consent-preferences')) {
                this.showPreferences();
            }
        });
    }
    
    // Public API methods
    getConsentStatus() {
        return {
            consentGiven: this.consentGiven,
            preferences: this.preferences,
            isEEARegion: this.isEEARegion()
        };
    }
    
    revokeConsent() {
        localStorage.removeItem(this.options.storageKey);
        this.preferences = null;
        this.consentGiven = false;
        this.setDefaultConsent();
        this.showConsentBanner();
        this.trackConsentEvent('consent_revoked');
    }
    
    updateConsent(newPreferences) {
        const preferences = {
            ...this.preferences,
            ...newPreferences,
            consentGiven: true
        };
        
        this.savePreferences(preferences);
        this.updateGTMConsent(preferences);
        this.trackConsentEvent('consent_updated', preferences);
    }
}

// Initialize consent manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.consentManager = new ConsentManager();
});

// Backward compatibility functions
function acceptConsent() {
    if (window.consentManager) {
        window.consentManager.acceptAll();
    }
}

function declineConsent() {
    if (window.consentManager) {
        window.consentManager.declineAll();
    }
}

function showConsentPreferences() {
    if (window.consentManager) {
        window.consentManager.showPreferences();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsentManager;
}

