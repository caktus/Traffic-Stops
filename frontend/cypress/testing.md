# Testing 🛠

## Cypress

This project tests frontend functionality with E2E testing using [Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html).

See Cypress docs and current tests for guidance on E2E testing with Cypress. Note the use of [fixtures](cypress/fixtures) rather than directly accessing the copwatch API. This should be sufficient, and is feasible because we don't expect any part of the web app to be behind an auth wall.
