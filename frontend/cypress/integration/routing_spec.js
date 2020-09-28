import { ABOUT_SLUG, AGENCY_SEARCH_SLUG } from '../../src/Routes/slugs';

describe('Component Routing', () => {
  it('visiting "/" renders the About page', () => {
    cy.visit(ABOUT_SLUG);
    cy.get('[data-testid="AboutPage"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });

  it('visiting "/agencies" renders the AgencySearch page', () => {
    cy.visit(AGENCY_SEARCH_SLUG);
    cy.get('[data-testid="AgencySearch"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });

  it('visiting "/agencies/:agencyId" renders AgencyData page', () => {
    cy.visit(`${AGENCY_SEARCH_SLUG}/**`);
    cy.get('[data-testid="AgencyData"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });
  it('...and the Sidebar is visible.', () => {
    cy.get('[data-testid="Sidebar"]');
  });
});
