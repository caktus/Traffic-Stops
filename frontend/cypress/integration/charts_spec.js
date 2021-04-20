import { AGENCY_DATA_SLUG, AGENCY_LIST_SLUG } from '../../src/Routes/slugs';
import { MIN_DELAY } from '../../src/Components/Containers/AsyncRoute';
import { getStopsByReasonURL } from '../../src/Services/endpoints';

describe('Chart behavior', () => {
  beforeEach(() => {
    cy.visit(`${AGENCY_LIST_SLUG}${AGENCY_DATA_SLUG}/**`);
  });

  describe('Stops By Reason Chart', () => {
    beforeEach(() => {
      cy.get('[data-testid="StopsByReasonNavLink"]').click();
      cy.server();
      cy.route('GET', getStopsByReasonURL('**'), 'fixture:stopsByReason').as('getStopsByReason');
    });

    it(`Renders skeleton for minimum of ${MIN_DELAY}ms`, () => {
      cy.get('[data-testid="PieSkeleton"]');
      cy.wait(MIN_DELAY);
      cy.get('[data-testid="PieSkeleton"]').should('not.exist');
      cy.wait('@getStopsByReason');
      cy.get('[data-testid="StopsByReason"]');
    });

    it('Loads chart data on mount', () => {
      cy.wait('@getStopsByReason');
      cy.get('[data-testid="StopsByReasonChart"]');
    });
  });
});
