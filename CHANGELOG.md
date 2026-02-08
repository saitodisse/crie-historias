# Changelog

## [1.0.2] - 2026-02-08

### Added

- Integrated dynamic pricing for Google Gemini models using the Cloud Billing Catalog API.
- Added `GoogleBillingService` with support for both API Key and Service Account authentication.
- Created `server/scripts/fetch-billing.ts` for diagnostic and verification of billing SKUs.
- Added dependency on `google-auth-library`.

### Changed

- Refactored Gemini model listing route to inject dynamic pricing descriptions.
- Improved fallback logic for users without configured API keys.

## [1.0.1] - 2026-02-07

### Fixed

- Fixed issue where multiple creative profiles could be active simultaneously.
- Ensured deterministic retrieval of the active profile by sorting by creation date.
- Added detailed logging to AI generation endpoint to track profile usage.
