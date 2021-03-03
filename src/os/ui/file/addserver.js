goog.module('os.ui.file.AddServer');
goog.module.declareLegacyNamespace();

const FileParserConfig = goog.require('os.parse.FileParserConfig');
const Module = goog.require('os.ui.Module');
const ImportManager = goog.require('os.ui.im.ImportManager');
const ProviderImportLoadEvents = goog.require('os.ui.ProviderImportLoadEvents');
const uiWindow = goog.require('os.ui.window');

const helpWindowId = 'url-help';


/**
 * The addserver directive.
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/addserver.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'addserver';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the addserver directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this['scope_'] = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this['element_'] = $element;

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    /**
     * @type {os.ui.im.ImportManager}
     */
    this['im'] = ImportManager.getInstance();

    /**
     * @type {string}
     */
    this['serverType'] = null;

    /**
     * Available server type choices in the UI.
     * @type {Array}
     */
    this['items'] = Object.values(ImportManager.getInstance().getServerTypes() || {});

    $scope.$emit(os.ui.WindowEventType.READY);
    $scope.$on(ProviderImportLoadEvents['start'], this.onFormLoadingStatusChange_.bind(this));
    $scope.$on(ProviderImportLoadEvents['stop'], this.onFormLoadingStatusChange_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   * @private
   */
  onDestroy_() {
    this['scope_'] = null;
    this['element_'] = null;
  }

  /**
   * Get the appropriate UI for the serverType.
   * @param {?string} item
   * @return {?string} UI
   */
  getUi(item) {
    if (item) {
      return ImportManager.getInstance().getServerType(item['type']).ui;
    }

    return null;
  }

  /**
   * Update the uiswitch scope.
   * @param {angular.Scope} scope The scope.
   * @export
   */
  updateUiScope(scope) {
    const config = new FileParserConfig();
    config['enabled'] = true;

    scope['config'] = config;
  }

  /**
   * Launches the server specific URL help dialog.
   * @export
   */
  launchHelp() {
    if (!uiWindow.exists(helpWindowId)) {
      var item = this['serverType']['label'] + ' URL ';
      uiWindow.create({
        'label': item + 'Formats',
        'icon': 'fa fa-clock-o',
        'x': '-10',
        'y': 'center',
        'width': '550',
        'height': '500',
        'show-close': true,
        'modal': true,
        'id': helpWindowId
      }, this['serverType']['helpUi']);
    }
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    if (this['element_']) {
      os.ui.window.close(this['element_']);
    }
  }

  /**
   * Handles loading form.
   * @param {angular.Scope.Event} event
   * @private
   */
  onFormLoadingStatusChange_(event) {
    switch (event.name) {
      case ProviderImportLoadEvents['start']:
        this['loading'] = true;
        break;
      case ProviderImportLoadEvents['stop']:
        this['loading'] = false;
        break;
      default:
        break;
    }
  }

  /**
   * Handles server type change.
   * @export
   */
  onServerTypeChange_() {
    const helpWindow = uiWindow.getById(helpWindowId);
    if (helpWindow) {
      uiWindow.close(helpWindow);
    }
  }
}


/**
 * Launch a window that will add servers
 */
const launchAddServerWindow = function() {
  const id = 'addServer';
  if (uiWindow.exists(id)) {
    uiWindow.bringToFront(id);
  } else {
    uiWindow.create({
      'id': id,
      'label': 'Add Server',
      'icon': 'fa fa-cloud-download',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '500',
      'max-width': '500',
      'height': 'auto',
      'modal': true,
      'show-close': true
    }, 'addserver');
  }
};


exports = {
  Controller,
  directive,
  launchAddServerWindow
};
