# Mountain View Lodge Website

This is the website for Mountain View Lodge, part of the multi-tenant motel analytics system.

## Configuration

- **Domain:** motel2.com
- **GA4 Measurement ID:** G-MOTEL2XXXXX
- **Phone:** (555) 987-6543
- **Email:** info@mountainviewlodge.com

## Features

- GA4 Analytics via GTM
- Custom event tracking (booking clicks, page scroll, newsletter signup)
- EEA-compliant consent management
- Responsive design
- Mountain Views
- Hiking Trail Access
- Ski Equipment Storage
- Hot Tub & Sauna

## Running Locally

```bash
# Start local server
npm start

# Or use Python directly
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Analytics Testing

1. Open GTM Preview mode
2. Visit the site
3. Interact with booking buttons, scroll, and newsletter signup
4. Check GA4 DebugView for events
5. Verify events are sent to G-MOTEL2XXXXX

## Consent Management

The site includes an EEA-compliant consent banner that:
- Detects EEA regions (simplified detection)
- Blocks analytics until consent is granted
- Provides granular consent options
- Integrates with GTM Consent Mode

## Customization

Site-specific customizations are in:
- `site-config.json` - Configuration settings
- `index.html` - Main website file
- `analytics.js` - Enhanced analytics tracking
- `consent-manager.js` - Consent management system
