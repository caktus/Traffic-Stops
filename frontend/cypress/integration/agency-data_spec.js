import { getAgencyURL } from '../../src/Services/endpoints';

describe('AgencyData component behavior', () => {
  it('Fetches agency details on render', () => {
    cy.server();
    cy.route('GET', getAgencyURL('**'), 'fixture:agency');
    cy.visit('/agencies/**');
    cy.contains('Durham Testing Department');
  });
});
