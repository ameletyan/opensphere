goog.provide('os.ui.LayerTreeCtrl');
goog.provide('os.ui.layerTreeDirective');

goog.require('os.data.LayerNode');
goog.require('os.data.ZOrder');
goog.require('os.layer');
goog.require('os.layer.FolderManager');
goog.require('os.layer.LayerGroup');
goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.slick.slickTreeDirective');


/**
 * The layer tree directive.
 *
 * @return {angular.Directive}
 */
os.ui.layerTreeDirective = function() {
  var dir = os.ui.slick.slickTreeDirective();
  dir['controller'] = os.ui.LayerTreeCtrl;
  return dir;
};


/**
 * Add the directive to the ui module
 */
os.ui.Module.directive('layertree', [os.ui.layerTreeDirective]);



/**
 * Controller for layers tree
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.slick.SlickTreeCtrl}
 * @constructor
 * @ngInject
 */
os.ui.LayerTreeCtrl = function($scope, $element, $compile) {
  $scope['dragEnabled'] = true;
  os.ui.LayerTreeCtrl.base(this, 'constructor', $scope, $element, $compile);
};
goog.inherits(os.ui.LayerTreeCtrl, os.ui.slick.SlickTreeCtrl);


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.canDragRows = function(rows) {
  var firstNode = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[0]));

  // Must have a node to drag
  if (!firstNode) {
    return false;
  }

  // Only allow dragging past depth 1 if the node supports it
  var isLayerNode = firstNode instanceof os.data.LayerNode || firstNode instanceof os.data.FolderNode;
  if (!isLayerNode && !firstNode.supportsInternalDrag()) {
    return false;
  }

  // Only allow depth 0 for layer nodes
  var depth = firstNode.depth;
  if (depth === 0 && !isLayerNode) {
    return false;
  }

  for (var i = 1, n = rows.length; i < n; i++) {
    var node = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[i]));

    // Don't allow dragging layer nodes and non-layer nodes
    if (node instanceof os.data.LayerNode != isLayerNode) {
      return false;
    }

    // Don't allow moving depths different than the first row.
    if (node.depth != depth) {
      return false;
    }

    // If not dragging layer nodes, make sure dragging is supported by the nodes.
    if (!isLayerNode && !node.supportsInternalDrag()) {
      return false;
    }
  }

  // All good, proceed
  return true;
};


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.canDragMove = function(rows, insertBefore) {
  var beforeItem;
  if (isNaN(insertBefore)) {
    return false;
  }

  var nodeToMove = /** @type {os.ui.slick.SlickTreeNode} */ (this.dataView.getItem(rows[0]));
  if (!nodeToMove) {
    return false;
  }

  if (nodeToMove instanceof os.data.FolderNode) {
    // folders can always be dragged
    return true;
  } else if (nodeToMove instanceof os.data.LayerNode) {
    // Layer Node Drag Rules:
    // 1. Layers can only remain within their z-order group.
    // 2. Layers can be reparented to valid folders.

    for (var i = 0, n = rows.length; i < n; i++) {
      // no point in moving before or after itself
      if (rows[i] == insertBefore || rows[i] == insertBefore - 1) {
        return false;
      }

      var item = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[i]));
      beforeItem = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

      if (item instanceof os.data.FolderNode) {
        return true;
      }

      if (!beforeItem) {
        return false;
      }

      // cannot be dragged to a different Z-Order group
      var z = os.data.ZOrder.getInstance();
      var differentZ = z.getZType(item.getId()) !== z.getZType(beforeItem.getId());
      if (differentZ && item instanceof os.data.LayerNode && beforeItem instanceof os.data.LayerNode) {
        // return false;
      }
    }
  } else {
    // the item must support internal drag and meet the default tree drag criteria
    if (!nodeToMove.supportsInternalDrag() || !os.ui.LayerTreeCtrl.base(this, 'canDragMove', rows, insertBefore)) {
      return false;
    }

    beforeItem = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

    // source/target must share the same root node
    if (!beforeItem || beforeItem.getRoot() != nodeToMove.getRoot()) {
      return false;
    }

    return nodeToMove.canDropInternal(beforeItem, this.moveMode);
  }

  return true;
};


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.doMove = function(rows, insertBefore) {
  if (isNaN(insertBefore)) {
    return;
  }

  var nodeToMove = /** @type {os.ui.slick.SlickTreeNode} */ (this.dataView.getItem(rows[0]));
  if (!nodeToMove) {
    return;
  }

  if (nodeToMove instanceof os.data.LayerNode || nodeToMove instanceof os.data.FolderNode) {
    var fm = os.layer.FolderManager.getInstance();
    var z = os.data.ZOrder.getInstance();
    var after = false;
    var targetNode = /** @type {(os.data.LayerNode|os.data.FolderNode)} */ (this.grid.getDataItem(insertBefore));

    // iterate up the tree to ensure we're dropping onto another layer or a folder
    while (targetNode && !(targetNode instanceof os.data.LayerNode || targetNode instanceof os.data.FolderNode)) {
      after = true;
      insertBefore--;
      targetNode = /** @type {(os.data.LayerNode|os.data.FolderNode)} */ (this.grid.getDataItem(insertBefore));
    }

    if (targetNode) {
      var layer = targetNode instanceof os.data.LayerNode ? targetNode.getLayer() : null;
      var targetIds = [];

      if (targetNode instanceof os.data.LayerNode) {
        targetIds = [layer.getId()];
      } else if (targetNode instanceof os.data.FolderNode) {
        var children = targetNode.getChildren();
        if (children) {
          targetIds = children.map((child) => child instanceof os.data.LayerNode ? child.getLayer().getId() : null)
              .filter(os.fn.filterFalsey);
        }
      } else if (layer instanceof os.layer.LayerGroup) {
        targetIds = /** @type {os.layer.LayerGroup} */ (layer).getLayers().map(os.layer.mapLayersToIds);
      }

      for (var i = 0, n = rows.length; i < n; i++) {
        var moveNode = /** @type {(os.data.LayerNode|os.data.FolderNode)} */ (this.grid.getDataItem(rows[i]));

        if (moveNode) {
          var moveIds = [];

          if (moveNode instanceof os.data.LayerNode) {
            layer = moveNode.getLayer();
            moveIds = [layer.getId()];
          } else {
            // move all of the folder's children in the z-order
            var children = moveNode.getChildren();
            if (children) {
              moveIds = children.map((child) => child.getLayer().getId());
            }
          }

          if (layer instanceof os.layer.LayerGroup) {
            // move all the layer group's children in the z-order
            moveIds = /** @type {os.layer.LayerGroup} */ (layer).getLayers().map(os.layer.mapLayersToIds);
          }

          for (var j = 0, m = moveIds.length; j < m; j++) {
            for (var k = 0, l = targetIds.length; k < l; k++) {
              // use !after since the tree is sorted by descending z-index
              z.move(moveIds[j], targetIds[k], !after);
              fm.move(moveIds[j], targetIds[k], after);
            }
          }
        }
      }

      z.update();
      z.save();
      fm.persist();
    }
  } else if (nodeToMove.supportsInternalDrag()) {
    // use default tree drag behavior
    os.ui.LayerTreeCtrl.base(this, 'doMove', rows, insertBefore);
  }

  // update the UI
  this.scope.$emit('search');
};
