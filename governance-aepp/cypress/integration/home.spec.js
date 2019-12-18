describe('Home.vue', function () {
  it('Help text on first start is visible and closeable', () => {
    cy
      .visit('/');

    cy.get('.z-30 > .p-4')
      .should('contain', 'Tap the question mark to learn more (or anywhere to close).')
      .click()
      .should('not.exist');

  });
});
