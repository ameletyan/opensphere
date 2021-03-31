goog.provide('plugin.descriptor.ResultCardCtrl');
goog.provide('plugin.descriptor.descriptorResultCardDirective');

goog.require('os');
goog.require('os.data.DescriptorEvent');
goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
plugin.descriptor.descriptorResultCardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/descriptor/resultcard.html',
    controller: plugin.descriptor.ResultCardCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register the beresultcard directive.
 */
os.ui.Module.directive('descriptorresultcard', [plugin.descriptor.descriptorResultCardDirective]);



/**
 * Controller for the beresultcard directive.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.descriptor.ResultCardCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  this.scope_['short'] = false;
  this.scope_['showFullDescription'] = false;
  this.updateIcons();

  /**
   * @type {number|undefined}
   */
  this['featureCount'] = undefined;

  var result = /** @type {plugin.descriptor.DescriptorResult} */ (this.scope_['result']);
  if (result && result.featureCount != null) {
    this['featureCount'] = result.featureCount;
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Length of the snippet to show for long descriptions
 * @type {number}
 * @const
 */
plugin.descriptor.ResultCardCtrl.SNIPPET_LENGTH = 125;


/**
 * Clean up the controller.
 *
 * @private
 */
plugin.descriptor.ResultCardCtrl.prototype.destroy_ = function() {
  this.element_ = null;
  this.scope_ = null;
};


/**
 * Updates icons
 */
plugin.descriptor.ResultCardCtrl.prototype.updateIcons = function() {
  var icons = this.element_.find('.js-card-title-icons');
  // clear
  icons.children().remove();
  // add
  icons.prepend(this.getField('icons'));
};


/**
 * @return {os.data.IDataDescriptor} the descriptor
 */
plugin.descriptor.ResultCardCtrl.prototype.getDescriptor = function() {
  var result = /** @type {plugin.descriptor.DescriptorResult} */ (this.scope_['result']);
  return result ? result.getResult() : null;
};


/**
 * Get a field from the result.
 *
 * @param {string} field
 * @return {*}
 * @export
 */
plugin.descriptor.ResultCardCtrl.prototype.getField = function(field) {
  var d = this.getDescriptor();

  if (d) {
    switch (field.toLowerCase()) {
      case 'id': return d.getId();
      case 'active': return d.isActive();
      case 'icons': return d.getIcons();
      case 'provider': return d.getProvider();
      case 'tags': return d.getTags().join(', ');
      case 'title': return d.getTitle();
      case 'type': return d.getSearchType();
      case 'description': return d.getDescription();
      default: break;
    }
  }

  return '';
};


/**
 * Toggles the descriptor
 * @param {Event} event The click event.
 *
 * @export
 */
plugin.descriptor.ResultCardCtrl.prototype.toggle = function(event) {
  event.preventDefault();
  event.stopPropagation();

  var d = this.getDescriptor();

  if (d) {
    d.setActive(!d.isActive());

    if (d.isActive()) {
      os.dispatcher.dispatchEvent(new os.data.DescriptorEvent(os.data.DescriptorEventType.USER_TOGGLED, d));
    }
  }
};
