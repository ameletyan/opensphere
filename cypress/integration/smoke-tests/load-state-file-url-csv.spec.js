/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Import state file', function() {
  before('Login', function() {
    cy.login();

    cy.server();
    cy.route('**/rows.csv?**', 'fx:/smoke-tests/load-state-file-url-csv/fireballs-bolides.stub.csv')
        .as('getCSV');
  });

  it('Load data from state file', function() {
    // Setup
    cy.get(os.Toolbar.Date.INPUT).should('not.have.value', '2019-04-17');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', 'No coordinate');
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fireballs and Bolides Features (92)');

    // Test
    cy.get(os.Toolbar.addData.OPEN_FILE_BUTTON).click();
    cy.get(os.importDataDialog.DIALOG).should('be.visible');
    cy.upload('smoke-tests/load-state-file-url-csv/test-state-file-fireball.xml');
    cy.get(os.importDataDialog.NEXT_BUTTON).click();
    cy.get(os.importStateDialog.DIALOG).should('be.visible');
    cy.get(os.importStateDialog.CLEAR_CHECKBOX).check();
    cy.get(os.importStateDialog.OK_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT).should('have.value', '2019-04-17');
    cy.get(os.Map.MAP_MODE_BUTTON).should('contain', '2D');
    cy.get(os.Application.PAGE).trigger('mouseenter').trigger('mousemove');
    cy.get(os.statusBar.COORDINATES_TEXT).should('contain', '+129');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4, {timeout: 8000})
        .should('contain', 'Fireballs and Bolides Features (92)');
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).rightClick();
    cy.get(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.Server.contextMenu.menuOptions.FEATURE_ACTIONS).click();
    cy.get(os.featureActionsDialog.DIALOG).should('be.visible');
    cy.get(os.featureActionsDialog.DIALOG).should('contain', 'high impact energy');
    cy.get(os.featureActionsDialog.DIALOG_CLOSE).click();

    // Clean up
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4).click();
    cy.get(os.layersDialog.Tabs.Layers.Tree.LAYER_4)
        .find(os.layersDialog.Tabs.Layers.Tree.Type.featureLayer.REMOVE_LAYER_BUTTON_WILDCARD)
        .click();
    cy.get(os.layersDialog.DIALOG).should('not.contain', 'Fireballs and Bolides Features (92)');
    cy.get(os.layersDialog.Tabs.Areas.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.Tabs.Filters.TAB).click();
    cy.get(os.layersDialog.DIALOG).should('contain', 'No results');
    cy.get(os.layersDialog.Tabs.Layers.TAB).click();
    cy.get(os.Application.PAGE).type('v');
    cy.get(os.Toolbar.Date.INPUT).clear();
    cy.get(os.Toolbar.Date.INPUT).type(Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.Date.INPUT).type('{esc}');
    cy.get(os.Toolbar.States.Menu.BUTTON).click();
    cy.get(os.Toolbar.States.Menu.menuOptions.DISABLE_STATES).click();
  });
});
