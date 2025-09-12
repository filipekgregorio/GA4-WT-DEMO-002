/**
 * Enhanced Analytics Tracking Module
 * Provides comprehensive event tracking for multi-tenant motel websites
 */

class MotelAnalytics {
    constructor() {
        this.dataLayer = window.dataLayer || [];
        this.scrollThresholds = [25, 50, 75, 100];
        this.scrollTracked = {};
        this.sessionStartTime = Date.now();
        this.pageViewId = this.generateUniqueId();
        
        this.init();
    }
    
    init() {
        this.setupScrollTracking();
        this.setupFormTracking();
        this.setupLinkTracking();
        this.setupEngagementTracking();
        this.trackPageView();
    }
    
    generateUniqueId() {
        return 'pv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Core tracking method
    track(eventName, parameters = {}) {
        const eventData = {
            event: eventName,
            page_view_id: this.pageViewId,
            timestamp: Date.now(),
            ...parameters
        };
        
        this.dataLayer.push(eventData);
        
        // Debug logging (remove in production)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
            console.log('Analytics Event:', eventData);
        }
    }
    
    // Page view tracking with enhanced data
    trackPageView() {
        const pageData = {
            page_title: document.title,
            page_location: window.location.href,
            page_referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        this.track('page_view_enhanced', pageData);
    }
    
    // Booking click tracking with context
    trackBookingClick(element, context = {}) {
        const bookingData = {
            event_category: 'conversion',
            event_label: context.label || 'Book Now Button',
            button_text: element.textContent.trim(),
            button_location: this.getElementLocation(element),
            page_section: this.getPageSection(element),
            time_on_page: Date.now() - this.sessionStartTime,
            ...context
        };
        
        this.track('booking_click', bookingData);
    }
    
    // Enhanced scroll tracking
    setupScrollTracking() {
        let ticking = false;
        
        const updateScrollProgress = () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
            
            // Update scroll indicator
            const indicator = document.getElementById('scrollIndicator');
            if (indicator) {
                indicator.style.width = scrollPercent + '%';
            }
            
            // Track scroll milestones
            this.scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !this.scrollTracked[threshold]) {
                    this.trackPageScroll(threshold);
                    this.scrollTracked[threshold] = true;
                }
            });
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollProgress);
                ticking = true;
            }
        });
    }
    
    trackPageScroll(depth) {
        const scrollData = {
            event_category: 'engagement',
            event_label: 'Page Scroll',
            scroll_depth: depth,
            time_to_scroll: Date.now() - this.sessionStartTime,
            page_height: document.documentElement.scrollHeight,
            viewport_height: window.innerHeight
        };
        
        this.track('page_scroll', scrollData);
    }
    
    // Newsletter signup tracking
    trackNewsletterSignup(form, email) {
        const signupData = {
            event_category: 'conversion',
            event_label: 'Newsletter Subscription',
            form_location: this.getElementLocation(form),
            email_domain: email.split('@')[1] || 'unknown',
            time_on_page: Date.now() - this.sessionStartTime
        };
        
        this.track('newsletter_signup', signupData);
    }
    
    // Form interaction tracking
    setupFormTracking() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formData = {
                    event_category: 'form',
                    form_id: form.id || 'unnamed_form',
                    form_name: form.name || 'unnamed_form',
                    form_action: form.action || window.location.href,
                    form_method: form.method || 'get'
                };
                
                this.track('form_submit', formData);
            }
        });
        
        // Track form field interactions
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                const fieldData = {
                    event_category: 'form',
                    field_name: e.target.name || e.target.id || 'unnamed_field',
                    field_type: e.target.type || e.target.tagName.toLowerCase(),
                    form_id: e.target.form ? (e.target.form.id || 'unnamed_form') : 'no_form'
                };
                
                this.track('form_field_focus', fieldData);
            }
        });
    }
    
    // Link click tracking
    setupLinkTracking() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const linkData = {
                    event_category: 'navigation',
                    link_text: link.textContent.trim(),
                    link_url: link.href,
                    link_domain: new URL(link.href).hostname,
                    is_external: new URL(link.href).hostname !== window.location.hostname,
                    link_location: this.getElementLocation(link)
                };
                
                this.track('link_click', linkData);
            }
        });
    }
    
    // Engagement tracking (time on page, visibility, etc.)
    setupEngagementTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            const visibilityData = {
                event_category: 'engagement',
                visibility_state: document.visibilityState,
                time_on_page: Date.now() - this.sessionStartTime
            };
            
            this.track('page_visibility_change', visibilityData);
        });
        
        // Track when user is about to leave (beforeunload)
        window.addEventListener('beforeunload', () => {
            const sessionData = {
                event_category: 'engagement',
                session_duration: Date.now() - this.sessionStartTime,
                max_scroll_depth: Math.max(...Object.keys(this.scrollTracked).map(Number), 0)
            };
            
            this.track('session_end', sessionData);
        });
        
        // Track idle time
        let idleTimer;
        let isIdle = false;
        const idleTime = 30000; // 30 seconds
        
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            if (isIdle) {
                this.track('user_active', {
                    event_category: 'engagement',
                    idle_duration: Date.now() - this.idleStartTime
                });
                isIdle = false;
            }
            
            idleTimer = setTimeout(() => {
                if (!isIdle) {
                    this.idleStartTime = Date.now();
                    this.track('user_idle', {
                        event_category: 'engagement',
                        time_before_idle: Date.now() - this.sessionStartTime
                    });
                    isIdle = true;
                }
            }, idleTime);
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });
        
        resetIdleTimer();
    }
    
    // Utility methods
    getElementLocation(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + window.scrollX),
            y: Math.round(rect.top + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
    
    getPageSection(element) {
        // Try to find the closest section or container with an ID
        let current = element;
        while (current && current !== document.body) {
            if (current.id) {
                return current.id;
            }
            if (current.tagName === 'SECTION' || current.classList.contains('section')) {
                return current.className || 'unnamed_section';
            }
            current = current.parentElement;
        }
        return 'unknown_section';
    }
    
    // Custom event methods for specific motel actions
    trackRoomView(roomType, roomId) {
        this.track('room_view', {
            event_category: 'product',
            room_type: roomType,
            room_id: roomId,
            event_label: `Room View - ${roomType}`
        });
    }
    
    trackPriceCheck(checkInDate, checkOutDate, guests) {
        this.track('price_check', {
            event_category: 'conversion',
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            number_of_guests: guests,
            event_label: 'Price Check'
        });
    }
    
    trackAmenityInteraction(amenityName, interactionType) {
        this.track('amenity_interaction', {
            event_category: 'engagement',
            amenity_name: amenityName,
            interaction_type: interactionType,
            event_label: `Amenity - ${amenityName}`
        });
    }
    
    trackPhoneClick(phoneNumber) {
        this.track('phone_click', {
            event_category: 'conversion',
            phone_number: phoneNumber,
            event_label: 'Phone Number Click'
        });
    }
    
    trackDirectionsClick() {
        this.track('directions_click', {
            event_category: 'conversion',
            event_label: 'Get Directions'
        });
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.motelAnalytics = new MotelAnalytics();
});

// Backward compatibility functions for existing template
function trackBookingClick() {
    if (window.motelAnalytics) {
        const button = event.target || document.getElementById('bookingCTA');
        window.motelAnalytics.trackBookingClick(button, {
            label: 'Book Now Button - Hero Section'
        });
    }
    
    // Simulate booking redirect
    alert('Redirecting to booking system...');
}

function trackNewsletterSignup(event) {
    event.preventDefault();
    
    if (window.motelAnalytics) {
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        window.motelAnalytics.trackNewsletterSignup(form, email);
    }
    
    // Simulate form submission
    alert('Thank you for subscribing to our newsletter!');
    event.target.reset();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotelAnalytics;
}

