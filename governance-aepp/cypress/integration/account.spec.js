describe('Account.vue', function () {
  it('Navigate to account page', () => {
    cy
      .visit('/');

    cy.get('.z-30 > .p-4')
      .should('contain', 'Tap the question mark to learn more (or anywhere to close).')
      .click()
      .should('not.exist');

    cy.get('.rounded-full > .w-8')
      .eq(1)
      .click();

    cy.get('.overlay-loader', {timeout: 15000})
      .should('not.be.visible');

    cy.url()
      .should('contain', '/account');

  });

  it('Delegate Stake', () => {

    // Test invalid address
    cy.get('.ae-input')
      .eq(0)
      .type('ak_111111111111111111111111111111112');

    cy.get('img[alt="createDelegation"]')
      .click();

    cy.get('.bg-overlay .ae-card-main .ae-button')
      .eq(0)
      .should('be.visible')
      .click()
      .should('not.be.visible');

    // Test real address
    cy.get('.ae-input')
      .eq(0)
      .clear()
      .type('ak_11111111111111111111111111111111273Yts');

    cy.get('img[alt="createDelegation"]')
      .click();

    cy.get('.overlay-loader', {timeout: 20000})
      .should('not.be.visible');

    cy.get('#account-delegatee')
      .should('be.visible');

  });


  it('Revoke Stake', () => {
    cy.get('img[alt="delete"]')
      .click();

    cy.get('.overlay-loader', {timeout: 15000})
      .should('not.be.visible');

    cy.get('#account-delegatee')
      .should('not.be.visible');

  });
});
