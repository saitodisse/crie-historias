# Changelog

## [1.0.5] - 2026-02-09

### Changed

- Refatoração das rotas do servidor para melhor organização modular.
- Atualização da lógica de importação/exportação de dados no `storage.ts`.

## [1.0.4] - 2026-02-08

### Added

- Implementação de validação JSON e lógica de retentativa para geração de roteiros no Wizard, garantindo saída estruturada.
- Atualização do frontend para processar o retorno JSON e extrair título e conteúdo automaticamente.

## [1.0.3] - 2026-02-08

### Fixed

- Corrigida filtragem de prompts de roteiro no detalhe do roteiro e no wizard.
- Padronizadas categorias de prompts para minúsculo para evitar inconsistências.

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
