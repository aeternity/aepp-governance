describe('Create.vue', (() => {

  it('Can create poll', () => {
    cy
      .visit('/');

    const pollMockData = {
      title: 'Automated Test',
      description: 'Automated Test',
      link: 'https://github.com/aeternity/aepp-governance',
      options: ['to be deleted', 'option 1', 'option 2'],
      closeAtHeightDelta: -((20 * 24 * 30) - 5)
    };

    // Remove overlay
    cy.get('.z-30')
      .click();

    cy.get(':nth-child(3) > :nth-child(1) > .rounded-full > .w-8')
      .click({force: true})
      .url().should('contain', '/create');

    cy.get(':nth-child(4) > .ae-input-container > .ae-input-box > .ae-input')
      .type(pollMockData.title);

    cy.get(':nth-child(5) > .ae-input-container > .ae-input-box > .ae-input')
      .type(pollMockData.description);

    cy.get('.pb-2 > .ae-input-container > .ae-input-box > .ae-input')
      .type(pollMockData.link)
      .trigger('blur');

    cy.get(':nth-child(6) > .mx-4').should('contain', 'For easier discussion');


    pollMockData.options.forEach((option, index) => {
      cy.get('.ae-input-option')
        .eq(index)
        .type(option)
        .trigger('blur');
    });

    cy.get('.ae-input-option')
      .eq(0)
      .closest('.bg-white')
      .contains('×')
      .click();

    cy.get('.ae-input-option')
      .eq(0)
      .should('have.value', pollMockData.options[1]);

    cy.get('[type="number"] > .ae-input-box > .ae-input')
      .invoke('val')
      .as('closeHeight');

    cy.get('@closeHeight')
      .then(value => {

        cy.get('[type="number"] > .ae-input-box > .ae-input')
          .clear()
          .type(String(parseInt(value) + pollMockData.closeAtHeightDelta));
      });


    cy.get('.cy-primary-cta')
      .click();

    cy.get('.overlay-loader', {timeout: 30000})
      .should('not.be.visible');

    cy.url().should('contain', '/poll');

    cy.get('.cy-poll-title')
      .should('contain', pollMockData.title);

    cy.get('.cy-poll-description')
      .should('contain', pollMockData.description);

    cy.get('@closeHeight').then(closeHeight => {
      cy.get('.cy-poll-close-height')
        .should('contain', String(parseInt(closeHeight) + pollMockData.closeAtHeightDelta));
    });

    cy.get('.cy-poll-link')
      .should('contain', pollMockData.link);

    cy.get('.cy-poll-option')
      .eq(0)
      .should('have.text', pollMockData.options[1]);

    cy.get('.cy-poll-option')
      .eq(1)
      .should('have.text', pollMockData.options[2]);
  });
}));
