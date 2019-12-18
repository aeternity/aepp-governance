describe('Poll.vue', function () {
  it('Navigate to first poll', () => {
    cy
      .visit('/');

    cy.get('.z-30 > .p-4')
      .should('contain', 'Tap the question mark to learn more (or anywhere to close).')
      .click()
      .should('not.exist');

    cy.get('.ae-card.cursor-pointer')
      .first()
      .click();

    cy.url()
      .should('contain', '/poll');

  });
  it('Cast vote', () => {
    // VOTE
    cy.get('.ae-check > .ae-check-button')
      .first()
      .click();

    cy.get('.overlay-loader', {timeout: 10000})
      .should('not.be.visible');

    cy.get('.ae-check > input')
      .first()
      .should('be.checked');
  });
  it('Revoke Vote', () => {
    // REVOKE VOTE
    cy.get('.cy-primary-cta')
      .click();

    cy.get('.overlay-loader', {timeout: 10000})
      .should('not.be.visible');

    cy.get('.ae-check > input')
      .first()
      .should('not.be.checked');
  });
});
