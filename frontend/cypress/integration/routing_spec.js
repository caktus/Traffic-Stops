import { ABOUT_SLUG, AGENCY_LIST_SLUG } from '../../src/Routes/slugs';

describe('Component Routing', () => {
  it('visiting "/" renders the About page', () => {
    cy.visit(ABOUT_SLUG);
    cy.get('[data-testid="AboutPage"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });

  it('visiting "/agencies" renders the AgencyList page', () => {
    cy.visit(AGENCY_LIST_SLUG);
    cy.get('[data-testid="AgencyList"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });

  it('visiting "/agencies/:agencyId" renders AgencyData page', () => {
    cy.visit(`${AGENCY_LIST_SLUG}/**`);
    cy.get('[data-testid="AgencyData"]');
  });
  it('...and the Header is visible.', () => {
    cy.get('[data-testid="Header"]');
  });
  it('...and the Sidebar is visible.', () => {
    cy.get('[data-testid="Sidebar"]');
  });
});
