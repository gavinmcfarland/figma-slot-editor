// Add the event listener
let runtimeData = {"mode":"development","output":"dist","websockets":false,"debug":false,"command":"dev","instanceId":"gfW-QB9scjuwKUevpSxfh","port":3046,"manifest":{"name":"Slot Editor","id":"1017768834174399811","api":"1.0.0","main":"src/main.ts","editorType":["figma"],"menu":[{"name":"Make Slot","command":"makeSlot"},{"name":"Edit Slot","command":"editSlot"},{"name":"Remove Slot","command":"removeSlot"}],"relaunchButtons":[{"command":"editSlot","name":"Edit Slot","multipleSelection":true},{"command":"removeSlot","name":"Remove Slot","multipleSelection":true}],"networkAccess":{"allowedDomains":["none"],"devAllowedDomains":["http://localhost:3046","ws://localhost:9001"]}}};


async function getCommandHistory() {
	let commandHistory = await figma.clientStorage.getAsync('PLUGMA_COMMAND_HISTORY');

	// If there's no history, initialize the commandHistory object
	if (!commandHistory) {
		commandHistory = {};
	}

	// Retrieve the previous command to return first
	const previousCommand = commandHistory.previousCommand || null;
	const previousInstanceId = commandHistory.previousInstanceId || null;

	// Set the current command as the new previous command for future retrievals
	commandHistory.previousCommand = runtimeData.command;
	commandHistory.previousInstanceId = runtimeData.instanceId;
	await figma.clientStorage.setAsync('PLUGMA_COMMAND_HISTORY', commandHistory);

	return { previousCommand, previousInstanceId };
}

async function getWindowSettings() {
	// Determine which command is running (dev or preview)
	const command = runtimeData.command;

	// Define default settings for both dev and preview commands
	const defaultDevSettings = {
		width: 400,
		height: 300,
		minimized: false,
		toolbarEnabled: false
	};

	const defaultPreviewSettings = {
		width: 400,
		height: 300,
		minimized: true,
		toolbarEnabled: true
	};

	// Define storage keys for dev and preview settings
	const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
	const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';
	let pluginWindowSettings;

	if (command === "dev") {
		// Get dev settings or set them if they don't exist
		pluginWindowSettings = await figma.clientStorage.getAsync(storageKeyDev);
		if (!pluginWindowSettings) {
			await figma.clientStorage.setAsync(storageKeyDev, defaultDevSettings);
			pluginWindowSettings = defaultDevSettings;
		}
	} else if (command === "preview") {
		// Get preview settings or set them if they don't exist
		pluginWindowSettings = await figma.clientStorage.getAsync(storageKeyPreview);
		if (!pluginWindowSettings) {
			await figma.clientStorage.setAsync(storageKeyPreview, defaultPreviewSettings);
			pluginWindowSettings = defaultPreviewSettings;
		}
	}

	return pluginWindowSettings;
}

async function setWindowSettings(pluginWindowSettings) {
	// Determine which command is running (dev or preview)
	const command = runtimeData.command;

	// Define storage keys for dev and preview settings
	const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
	const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';

	// Set the appropriate settings based on the command
	if (command === "dev") {
		await figma.clientStorage.setAsync(storageKeyDev, pluginWindowSettings);
	} else if (command === "preview") {
		await figma.clientStorage.setAsync(storageKeyPreview, pluginWindowSettings);
	}
}

function customResize(width, height) {

	getWindowSettings().then((pluginWindowSettings) => {

		// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
		if (pluginWindowSettings.minimized) {
			height = 40;
			width = 200
		}

		// Call the original figma.ui.resize method if it exists
		if (figma && figma.ui && typeof figma.ui.resize === 'function') {
			// To avoid Vite replacing figma.ui.resize and causing an infinite loop
			figma.ui['re' + 'size'](width, height);
		} else {
			console.warn('Figma UI resize method is not available.');
		}
	});
}

function customShowUI(htmlString, options) {

	getCommandHistory().then((commandHistory) => {
		getWindowSettings().then((pluginWindowSettings) => {

			let hasCommandChanged = commandHistory.previousCommand !== runtimeData.command
			let hasInstanceChanged = commandHistory.previousInstanceId !== runtimeData.instanceId

			// FIXME: Modify this so that this triggers each time the preview command is used. Accomplish this because generating an instance id from the CLI
			// If new instance of command reset toolbar and minimized window

			if (hasInstanceChanged) {

				if (runtimeData.command === "preview") {

					pluginWindowSettings.toolbarEnabled = true
					pluginWindowSettings.minimized = true
				}

				// if (runtimeData.command === "dev") {
				// 	pluginWindowSettings.toolbarEnabled = false
				// 	pluginWindowSettings.minimized = false
				// }
			}

			if (options && options.height) {
				pluginWindowSettings.height = options.height
			}

			if (options && options.width) {
				pluginWindowSettings.width = options.width
			}


			if (pluginWindowSettings.toolbarEnabled) {
				options.height = pluginWindowSettings.height + 40
			}

			// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
			if (pluginWindowSettings.minimized) {

				options = options || {}

				// Check if the options object exists and if it has a height property
				if (options && options.height) {
					// Override the height property
					options.height = 40;
					options.width = 200;
				}
			}



			if (figma && figma.showUI && typeof figma.showUI === 'function') {


				if (hasInstanceChanged) {
					// NOTE: we override position because preview mode is very opinionated about how it's used and will reset the position each time the command is used
					// if (!options.position) {
					if (runtimeData.command === "preview") {
						const zoom = figma.viewport.zoom;

						options.position = {
							x: figma.viewport.bounds.x + (12 / zoom),
							y: figma.viewport.bounds.y + (figma.viewport.bounds.height - ((80 + 12) / zoom))
						}
					}
					// }

				}

				// NOTE: Because we can't get the last used window position, we reset it to the center when the user changes to dev
				if (hasCommandChanged) {
					if (runtimeData.command === "dev") {
						const zoom = figma.viewport.zoom;

						if (!options.position) {
							options.position = {
								x: (figma.viewport.center.x - ((options.width / 2) / zoom)),
								// Remember to take into account height of plugin window toolbar which is 40px
								y: (figma.viewport.center.y - (((options.height + 40) / 2) / zoom))
							}
						}
					}
				}




				figma['show' + 'UI'](htmlString, options);

				if (pluginWindowSettings.toolbarEnabled) {
					figma.ui.postMessage(
						{ event: 'PLUGMA_SHOW_TOOLBAR' }
					)
				}
				else {
					figma.ui.postMessage(
						{ event: 'PLUGMA_HIDE_TOOLBAR' }
					)
				}

			} else {
				console.warn('Figma showUI method is not available.');
			}

			setWindowSettings(pluginWindowSettings)
		})
	})

}

figma.ui.on('message', async (message) => {
	// Check if the message type is "PLUGMA_MINIMISE_WINDOW"
	getWindowSettings().then((pluginWindowSettings) => {

		if (message.event === 'PLUGMA_MINIMISE_WINDOW') {
			pluginWindowSettings.minimized = true;
			figma.ui['re' + 'size'](200, message.toolbarHeight)
			setWindowSettings(pluginWindowSettings)

		}
		if (message.event === 'PLUGMA_MAXIMISE_WINDOW') {
			pluginWindowSettings.minimized = false;

			figma.ui['re' + 'size'](pluginWindowSettings.width, pluginWindowSettings.height + message.toolbarHeight)
			setWindowSettings(pluginWindowSettings)

		}
		if (message.event === 'PLUGMA_INCREASE_WINDOW_HEIGHT') {
			pluginWindowSettings.minimized = false;
			pluginWindowSettings.toolbarEnabled = true;

			figma.ui['re' + 'size'](pluginWindowSettings.width, pluginWindowSettings.height + message.toolbarHeight)
			setWindowSettings(pluginWindowSettings)

		}
		if (message.event === 'PLUGMA_DECREASE_WINDOW_HEIGHT') {
			pluginWindowSettings.minimized = false;
			pluginWindowSettings.toolbarEnabled = false;

			figma.ui['re' + 'size'](pluginWindowSettings.width, pluginWindowSettings.height)
			setWindowSettings(pluginWindowSettings)

		}
	})

	if (message.event === "PLUGMA_DELETE_ROOT_PLUGIN_DATA") {
		let pluginDataKeys = figma.root.getPluginDataKeys();
		for (let i = 0; i < pluginDataKeys.length; i++) {
			let key = pluginDataKeys[i];
			figma.root.setPluginData(key, "");
			console.log(`Pugma: ${key} deleted from root pluginData`);
		}
		figma.notify("Root pluginData deleted");
	}

	if (message.event === "PLUGMA_DELETE_CLIENT_STORAGE") {
		let clientStorageKeys = await figma.clientStorage.keysAsync();
		for (let i = 0; i < clientStorageKeys.length; i++) {
			let key = clientStorageKeys[i];
			if (key !== "figma-stylesheet") {
				await figma.clientStorage.deleteAsync(key);
				console.log(`Pugma: ${key} deleted from clientStorage`);
			}
		}
		figma.notify("ClientStorage deleted");
	}
});
"use strict";
const eventListeners = [];
figma.ui.onmessage = (message) => {
  for (let eventListener of eventListeners) {
    if (message.action === eventListener.action) eventListener.callback(message.data);
  }
};
const nodeProps = [
  "id",
  "parent",
  "name",
  "removed",
  "visible",
  "locked",
  "children",
  "constraints",
  "absoluteTransform",
  "relativeTransform",
  "x",
  "y",
  "rotation",
  "width",
  "height",
  "constrainProportions",
  "layoutAlign",
  "layoutGrow",
  "opacity",
  "blendMode",
  "isMask",
  "effects",
  "effectStyleId",
  "expanded",
  "backgrounds",
  "backgroundStyleId",
  "fills",
  "strokes",
  "strokeWeight",
  "strokeMiterLimit",
  "strokeAlign",
  "strokeCap",
  "strokeJoin",
  "dashPattern",
  "fillStyleId",
  "strokeStyleId",
  "cornerRadius",
  "cornerSmoothing",
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
  "exportSettings",
  "overflowDirection",
  "numberOfFixedChildren",
  "overlayPositionType",
  "overlayBackground",
  "overlayBackgroundInteraction",
  "reactions",
  "description",
  "remote",
  "key",
  "layoutMode",
  "primaryAxisSizingMode",
  "counterAxisSizingMode",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "itemSpacing",
  // 'horizontalPadding',
  // 'verticalPadding',
  "layoutGrids",
  "gridStyleId",
  "clipsContent",
  "guides",
  "type"
];
const readOnly = ["id", "parent", "removed", "children", "absoluteTransform", "width", "height", "overlayPositionType", "overlayBackground", "overlayBackgroundInteraction", "reactions", "remote", "key", "type", "masterComponent", "mainComponent"];
function copyPaste(source, target, ...args) {
  var targetIsEmpty;
  if (target && Object.keys(target).length === 0 && target.constructor === Object) {
    targetIsEmpty = true;
  }
  var options;
  if (typeof args[0] === "function") args[0];
  if (typeof args[1] === "function") args[1];
  if (typeof args[0] === "object" && typeof args[0] !== "function") options = args[0];
  if (typeof args[0] === "object" && typeof args[0] !== "function") options = args[0];
  if (!options) options = {};
  const {
    include,
    exclude,
    withoutRelations,
    removeConflicts
  } = options;
  let allowlist = nodeProps.filter(function(el) {
    return !readOnly.includes(el);
  });
  if (include) {
    allowlist = include.filter(function(el) {
      return !readOnly.includes(el);
    });
  }
  if (exclude) {
    allowlist = allowlist.filter(function(el) {
      return !exclude.concat(readOnly).includes(el);
    });
  }
  if (target && !targetIsEmpty) {
    allowlist = allowlist.filter(function(el) {
      return !["id", "type"].includes(el);
    });
  }
  var obj = {};
  if (targetIsEmpty) {
    if (obj.id === void 0) {
      obj.id = source.id;
    }
    if (obj.type === void 0) {
      obj.type = source.type;
    }
    if (source.key) obj.key = source.key;
  }
  const props = Object.entries(Object.getOwnPropertyDescriptors(source.__proto__));
  for (const [key, value] of props) {
    if (allowlist.includes(key)) {
      try {
        if (typeof obj[key] === "symbol") {
          obj[key] = "Mixed";
        } else {
          obj[key] = value.get.call(source);
        }
      } catch (err) {
        obj[key] = void 0;
      }
    }
  }
  if (!removeConflicts) {
    !obj.fillStyleId && obj.fills ? delete obj.fillStyleId : delete obj.fills;
    !obj.strokeStyleId && obj.strokes ? delete obj.strokeStyleId : delete obj.strokes;
    !obj.backgroundStyleId && obj.backgrounds ? delete obj.backgroundStyleId : delete obj.backgrounds;
    !obj.effectStyleId && obj.effects ? delete obj.effectStyleId : delete obj.effects;
    !obj.gridStyleId && obj.layoutGrids ? delete obj.gridStyleId : delete obj.layoutGrids;
    if (obj.textStyleId) {
      delete obj.fontName;
      delete obj.fontSize;
      delete obj.letterSpacing;
      delete obj.lineHeight;
      delete obj.paragraphIndent;
      delete obj.paragraphSpacing;
      delete obj.textCase;
      delete obj.textDecoration;
    } else {
      delete obj.textStyleId;
    }
    if (obj.cornerRadius !== figma.mixed) {
      delete obj.topLeftRadius;
      delete obj.topRightRadius;
      delete obj.bottomLeftRadius;
      delete obj.bottomRightRadius;
    } else {
      delete obj.cornerRadius;
    }
  }
  if (targetIsEmpty) {
    if (source.parent && !withoutRelations) {
      obj.parent = {
        id: source.parent.id,
        type: source.parent.type
      };
    }
  }
  if (targetIsEmpty) {
    if (source.type === "FRAME" || source.type === "COMPONENT" || source.type === "COMPONENT_SET" || source.type === "PAGE" || source.type === "GROUP" || source.type === "INSTANCE" || source.type === "DOCUMENT" || source.type === "BOOLEAN_OPERATION") {
      if (source.children && !withoutRelations) {
        obj.children = source.children.map((child) => copyPaste(child, {}, {
          withoutRelations
        }));
      }
    }
    if (source.type === "INSTANCE") {
      if (source.mainComponent && !withoutRelations) {
        obj.masterComponent = copyPaste(source.mainComponent, {}, {
          withoutRelations
        });
      }
    }
  }
  Object.assign(target, obj);
  return obj;
}
function setPluginData(node, key, data) {
  node.setPluginData(key, JSON.stringify(data));
}
var selectionSet = false;
var origSel = figma.currentPage.selection;
var newSel = [];
function putValuesIntoArray(value) {
  return Array.isArray(value) ? value : [value];
}
function getPluginData(node, key) {
  var data = node.getPluginData(key);
  if (data) return JSON.parse(data);
}
function findComponentById(id) {
  var node = figma.getNodeById(id);
  if (node) {
    if (node.parent === null || node.parent.parent === null) {
      figma.currentPage.appendChild(node);
      return node;
    } else {
      return node;
    }
  } else {
    return null;
  }
}
const isPageNode = (node) => {
  return node.type === "PAGE";
};
const getTopLevelParent = (node) => {
  if (node && node.parent && !isPageNode(node.parent)) {
    return getTopLevelParent(node.parent);
  } else {
    return node;
  }
};
function isPartOfInstance(node) {
  const parent = node.parent;
  if (parent.type === "INSTANCE") {
    return true;
  } else if (parent.type === "PAGE") {
    return false;
  } else {
    return isPartOfInstance(parent);
  }
}
function isPartOfComponent(node) {
  const parent = node.parent;
  if (parent.type === "COMPONENT") {
    return true;
  } else if (parent.type === "PAGE") {
    return false;
  } else {
    return isPartOfComponent(parent);
  }
}
function getComponentParent(node) {
  var _a;
  if (node.type === "COMPONENT") return node;
  if (node.type === "PAGE") return null;
  if (((_a = node == null ? void 0 : node.parent) == null ? void 0 : _a.type) === "COMPONENT") {
    return node.parent;
  } else {
    return getComponentParent(node == null ? void 0 : node.parent);
  }
}
function getSlotParent(node) {
  if (getPluginData(node, "isSlotParent")) return node;
  if (node.type === "PAGE") return null;
  if (getPluginData(node == null ? void 0 : node.parent, "isSlotParent")) {
    return node.parent;
  } else {
    return getSlotParent(node == null ? void 0 : node.parent);
  }
}
const getRelativePosition = (node, relativeNode) => {
  relativeNode = relativeNode || getTopLevelParent(node);
  return {
    x: Math.abs(
      Math.round(
        relativeNode.absoluteTransform[0][2] - node.absoluteTransform[0][2]
      )
    ),
    y: Math.abs(
      Math.round(
        relativeNode.absoluteTransform[1][2] - node.absoluteTransform[1][2]
      )
    )
  };
};
function getNodeIndex(node) {
  return node.parent.children.indexOf(node);
}
function makeComponent(node, action = "make") {
  var origNode = node;
  var container = node.parent;
  node.x;
  node.y;
  var origNodeIndex = getNodeIndex(node);
  var clonedNode;
  const component = figma.createComponent();
  component.setRelaunchData({
    editSlot: "Edit the selected slot",
    removeSlot: "Remove the selected slot"
  });
  setPluginData(component, "isSlot", true);
  component.resizeWithoutConstraints(node.width, node.height);
  if (node.type === "FRAME" || node.type === "INSTANCE") {
    copyPaste(node, component);
    if (node.type === "INSTANCE") {
      clonedNode = node.clone();
      node = clonedNode.detachInstance();
    }
    console.log("-----", node.name, component);
    for (const child of node.children) {
      component.appendChild(child);
    }
    if (action === "edit") {
      if (origNode.type === "INSTANCE") {
        origNode.swapComponent(component);
      }
    }
  } else {
    if (node.type === "TEXT") {
      component.layoutMode = "VERTICAL";
      if (node.textAutoResize === "HEIGHT") {
        component.primaryAxisSizingMode = "AUTO";
      }
      if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
        component.primaryAxisSizingMode = "AUTO";
        component.counterAxisSizingMode = "AUTO";
      }
    }
    copyPaste(node, component, {
      include: ["layoutAlign", "layoutGrow", "name", "x", "y"]
    });
    component.appendChild(node);
  }
  if (action === "make") {
    var instance = component.createInstance();
    copyPaste(node, instance, {
      include: ["layoutAlign", "layoutGrow", "constraints", "x", "y"]
    });
    node.x = 0;
    node.y = 0;
    container.insertChild(origNodeIndex, instance);
    if (origNode.type === "INSTANCE" && origNode) origNode.remove();
    newSel.push(instance);
  }
  if (node.type === "FRAME") {
    node.remove();
  }
  component.remove();
  return {
    component,
    origNode
  };
}
var countNumberSlots = 0;
var numberSlots = 0;
function countSlots(nodes) {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (getPluginData(node, "isSlot")) {
      countNumberSlots += 1;
    }
    if (node.children) {
      countSlots(node.children);
    }
  }
  console.log(countNumberSlots);
  return countNumberSlots;
}
function removeSlot(node, traverseChildren = true) {
  var nodes = putValuesIntoArray(node);
  for (var i = 0; i < nodes.length; i++) {
    let node2 = nodes[i];
    if (getPluginData(node2, "isSlot")) {
      numberSlots += 1;
      traverseChildren = false;
    }
    if (node2.type === "INSTANCE") {
      var newName;
      newName = node2.mainComponent.name.replace(/<slot>$/, "");
      newName = newName.trim();
      if (newName !== node2.mainComponent.name) {
        node2.mainComponent.name = newName;
      }
      node2.name = node2.name.replace(/<slot>$/, "");
      node2.name = node2.name.trim();
    }
    var parentComponent = getComponentParent(node2);
    setPluginData(node2, "isSlot", "");
    if (traverseChildren) {
      if (node2.children) {
        removeSlot(node2.children);
      }
    }
    if (node2.id !== (parentComponent == null ? void 0 : parentComponent.id)) {
      node2.setRelaunchData({});
    }
  }
  return numberSlots;
}
var nSlotsFound = 0;
function editSlot(node) {
  var nodes = putValuesIntoArray(node);
  for (var i = 0; i < nodes.length; i++) {
    let node2 = nodes[i];
    if (getPluginData(node2, "isSlot") && node2.type === "INSTANCE") {
      let setPosition = function(node3) {
        if (figma.getNodeById(node3.id) && figma.getNodeById(component.id)) {
          var relativePosition = getRelativePosition(node3);
          component.x = getTopLevelParent(node3).x + relativePosition.x;
          component.y = getTopLevelParent(node3).y + relativePosition.y;
        }
      };
      nSlotsFound += 1;
      let nodeOpacity = node2.opacity;
      let nodeLayoutAlign = node2.layoutAlign;
      let nodePrimaryAxisSizingMode = node2.primaryAxisSizingMode;
      let nodeCounterAxisSizingMode = node2.counterAxisSizingMode;
      node2.layoutGrow;
      node2.parent;
      let origNodeVisible = node2.visible;
      let { component } = makeComponent(node2, "edit");
      component.visible = origNodeVisible;
      if (selectionSet === false) {
        figma.currentPage.selection = [];
        selectionSet = true;
      }
      if (figma.getNodeById(component.id)) {
        figma.currentPage.appendChild(component);
      }
      setPosition(node2);
      setInterval(() => {
        if (component.parent === null) {
          node2.visible = false;
        }
        setPosition(node2);
        if (figma.getNodeById(node2.id) && figma.getNodeById(component.id)) {
          component.resize(node2.width, node2.height);
          component.layoutAlign = nodeLayoutAlign;
          component.primaryAxisSizingMode = nodePrimaryAxisSizingMode;
          component.counterAxisSizingMode = nodeCounterAxisSizingMode;
        }
      }, 100);
      if (figma.getNodeById(node2.id)) {
        node2.opacity = 0;
      }
      figma.on("close", () => {
        if (figma.getNodeById(node2.id)) {
          node2.opacity = nodeOpacity;
        }
        let freshComponent = findComponentById(component.id);
        if (freshComponent && (freshComponent == null ? void 0 : freshComponent.parent) !== null) {
          if (node2.type !== "COMPONENT") {
            freshComponent.remove();
          }
        }
        if (figma.getNodeById(origSel[0].id)) {
          if (node2.type !== "COMPONENT") {
            figma.currentPage.selection = origSel;
          }
        }
      });
    } else {
      if (node2.children) {
        editSlot(node2.children);
      }
    }
  }
  return nSlotsFound;
}
console.clear();
function plugmaMain() {
  if (figma.command === "makeSlot") {
    var sel = figma.currentPage.selection;
    var numberSlotsMade = 0;
    if (countSlots(sel) > 1) {
      figma.closePlugin(`Already contains ${numberSlots} slots`);
    } else if (numberSlots === 1) {
      figma.closePlugin(`Already contains ${numberSlots} slot`);
    } else {
      for (var i = 0; i < sel.length; i++) {
        var node = sel[i];
        var isAwkward = isPartOfInstance(node);
        if (getPluginData(node, "isSlot") !== true) {
          if (!isAwkward && isPartOfComponent(node)) {
            var parentComponent = getComponentParent(node);
            if (parentComponent) {
              setPluginData(parentComponent, "isSlotParent", true);
              parentComponent.setRelaunchData({
                editSlot: "Edit slots on this instance",
                removeSlot: "Remove slots on this instance"
              });
            }
            var { component } = makeComponent(node);
            component.name = component.name + " <slot>";
            setPluginData(component, "isSlot", true);
            if (parentComponent) {
              if (node.type !== "INSTANCE") {
                component.remove();
              }
            }
            numberSlotsMade += 1;
          } else {
            if (isAwkward) {
              figma.notify("Edit main component to make slot");
            } else {
              figma.notify("Slot must be inside a component");
            }
          }
        } else {
          figma.notify("Already a slot");
        }
      }
      if (numberSlotsMade > 1) {
        figma.currentPage.selection = newSel;
        figma.notify(`${numberSlotsMade} slots made`);
      } else if (numberSlotsMade === 1) {
        figma.currentPage.selection = newSel;
        figma.notify(`${numberSlotsMade} slot made`);
      }
    }
    figma.closePlugin();
  }
  if (figma.command === "editSlot") {
    var sel = figma.currentPage.selection;
    if (sel.length > 0) {
      const handle = figma.notify("Editing slots...", {
        button: {
          text: "Done",
          action: () => {
            figma.closePlugin();
            return true;
          }
        },
        timeout: 99999999999
      });
      var nSlotsFound2 = editSlot(sel);
      if (nSlotsFound2 > 0) {
        figma.on("close", () => {
          handle.cancel();
        });
      }
      if (nSlotsFound2 === 0) {
        handle.cancel();
        figma.closePlugin("No slots found");
      }
    } else if (sel.length === 0) {
      figma.closePlugin("Please select a slot or instance with slots");
    }
  }
  if (figma.command === "removeSlot") {
    var nSlotsRemoved = removeSlot(figma.currentPage.selection);
    for (var i = 0; i < figma.currentPage.selection.length; i++) {
      var node = figma.currentPage.selection[i];
      var parent = getComponentParent(node) || getSlotParent(node);
      if (parent) {
        let count = countSlots([parent]);
        if (count < 1) {
          parent.setRelaunchData({});
        }
      }
    }
    if (nSlotsRemoved > 1) {
      figma.closePlugin(`${nSlotsRemoved} slots removed`);
    } else if (nSlotsRemoved === 1) {
      figma.closePlugin(`${nSlotsRemoved} slot removed`);
    } else {
      figma.closePlugin(`No slots found`);
    }
    figma.closePlugin();
  }
}
plugmaMain();
