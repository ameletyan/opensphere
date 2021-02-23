goog.module('os.menu.folder');
goog.module.declareLegacyNamespace();

const FolderManager = goog.require('os.layer.FolderManager');
const FolderNode = goog.require('os.data.FolderNode');
const layerMenu = goog.require('os.ui.menu.layer');
const {FolderEventType, launchRemoveFolder} = goog.require('os.layer.folder');
const {getLayersFromContext} = goog.require('os.ui.menu.layer');
const {getRandomString} = goog.require('goog.string');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItem = goog.requireType('os.ui.menu.MenuItem');
const {Context} = goog.requireType('os.ui.menu.layer');


/**
 * Whether the folder menu has been initialized.
 * @type {boolean}
 */
let initialized = false;


/**
 * Creates a folder.
 * @param {MenuEvent<Context>} event
 */
const createFolder = function(event) {
  const nodes = event.getContext();
  const layers = getLayersFromContext(nodes);
  const fm = FolderManager.getInstance();
  let parentId = '';
  let layerIds = [];

  if (layers) {
    layerIds = layers.map((l) => l.getId());

    // determine if we need to assign them to a parent
    const parent = nodes[0].getParent();
    if (parent) {
      parentId = parent.getId();
    }
  }

  fm.createOrEditFolder({
    id: getRandomString(),
    children: layerIds,
    name: 'New Folder',
    parentId: parentId,
    collapsed: false
  });
};


/**
 * Removes a folder.
 * @param {MenuEvent<Context>} event
 */
const unfolder = function(event) {
  const context = event.getContext()[0];

  if (context instanceof FolderNode) {
    launchRemoveFolder(context.getOptions(), onUnfolder.bind(undefined, context.getId()));
  }
};


/**
 * Handle unfoldering a folder.
 * @param {!string} id The ID to remove.
 * @protected
 */
const onUnfolder = (id) => {
  FolderManager.getInstance().removeFolder(id);
};


/**
 * Removes a folder.
 * @param {MenuEvent<Context>} event
 */
const removeFolder = function(event) {
  const context = event.getContext()[0];

  if (context instanceof FolderNode) {
    launchRemoveFolder(context.getOptions(), onRemoveFolder.bind(undefined, context), true);
  }
};


/**
 * Handle removing a folder and its child layers.
 * @param {!FolderNode} folderNode The folder node to remove.
 * @protected
 */
const onRemoveFolder = (folderNode) => {
  FolderManager.getInstance().removeFolder(folderNode.getId());
};


/**
 * Show a menu item if the context supports creating a folder.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const showCreateFolder = function(context) {
  this.visible = false;

  if (context && context.length > 0) {
    var layers = os.ui.menu.layer.getLayersFromContext(context);
    this.visible = layers.length == context.length;
  }
};


/**
 * Show a menu item if the context supports removing a folder.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const showRemoveFolder = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    const folder = /** @type {FolderNode} */ (context[0]);

    if (folder instanceof FolderNode) {
      this.visible = folder.hasChildren();
    }
  }
};


/**
 * Show a menu item if the context supports unfoldering.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const showUnfolder = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    this.visible = context[0] instanceof FolderNode;
  }
};


/**
 * Sets up analyze actions
 */
const setup = function() {
  layerMenu.setup();
  const menu = layerMenu.MENU;

  if (!initialized && menu) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.LAYER);
    initialized = true;

    group.addChild({
      label: 'Create Folder',
      eventType: FolderEventType.CREATE_FOLDER,
      tooltip: 'Creates a folder for layers.',
      icons: ['<i class="fa fa-fw fa-folder"></i>'],
      metricKey: 'os.layer.createFolder',
      beforeRender: showCreateFolder,
      handler: createFolder,
      sort: 0
    });

    group.addChild({
      label: 'Remove Folder and Children',
      eventType: FolderEventType.REMOVE_FOLDER,
      tooltip: 'Removes the folder and its children.',
      icons: ['<i class="fa fa-fw fa-times"></i>'],
      metricKey: 'os.layer.removeFolder',
      beforeRender: showRemoveFolder,
      handler: removeFolder,
      sort: 20
    });

    group.addChild({
      label: 'Unfolder',
      eventType: FolderEventType.UNFOLDER,
      tooltip: 'Unfolder the layers.',
      icons: ['<i class="fa fa-fw fa-folder"></i>'],
      metricKey: 'os.layer.unfolder',
      beforeRender: showUnfolder,
      handler: unfolder,
      sort: 10
    });
  }
};


exports = {
  setup
};
