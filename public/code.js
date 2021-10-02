'use strict';

var name = "svelte-app";
var version = "1.0.0";
var scripts = {
	build: "rollup -c",
	dev: "rollup -c -w",
	start: "sirv public",
	validate: "svelte-check"
};
var devDependencies = {
	"@figlets/helpers": "*",
	"@figma/plugin-typings": "^1.19.2",
	"@rollup/plugin-commonjs": "^17.0.0",
	"@rollup/plugin-json": "^4.1.0",
	"@rollup/plugin-node-resolve": "^11.0.0",
	"@rollup/plugin-replace": "^3.0.0",
	"@rollup/plugin-typescript": "^8.0.0",
	"@tsconfig/svelte": "^1.0.0",
	autoprefixer: "^10.2.5",
	plugma: "*",
	"postcss-logical": "^4.0.2",
	rollup: "^2.41.0",
	"rollup-plugin-css-only": "^3.1.0",
	"rollup-plugin-html-bundle": "0.0.3",
	"rollup-plugin-livereload": "^2.0.0",
	"rollup-plugin-node-polyfills": "^0.2.1",
	"rollup-plugin-postcss": "^4.0.0",
	"rollup-plugin-svelte": "^7.0.0",
	"rollup-plugin-terser": "^7.0.0",
	svelte: "^3.0.0",
	"svelte-check": "^1.2.3",
	"svelte-preprocess": "^4.0.0",
	tslib: "^2.1.0",
	typescript: "^4.0.0"
};
var dependencies = {
	postcss: "^8.2.7",
	"rollup-plugin-typescript": "^1.0.1",
	"sirv-cli": "^1.0.0"
};
var require$$0 = {
	name: name,
	"private": true,
	version: version,
	scripts: scripts,
	devDependencies: devDependencies,
	dependencies: dependencies
};

// TODO: Check package from working directory
// TODO: Check versions from working directory
// TODO: How to fix issue of referenceing file when used as depency
// import pkg from '../package.json';
// import versionHistory from './versions.json';
// import semver from 'semver';
// import fs from 'fs';
// import path from 'path';
var pkg;

{
    pkg = require$$0;
}
// try {
// 	versionHistory = require("./package.json");
// }
// catch {
// 	versionHistory = {}
// }
// pkg = require(process.cwd() + "/package.json");
// }
// console.log(process.cwd() + "/package.json");
// fs.readFile("../package.json", (err, data) => {
// 	console.log(err, data)
// })
// const file = require("package.json")
// console.log(file)
// function updateAvailable() {
// 	var currentVersion = figma.root.getPluginData("pluginVersion") || pkg.version;
// 	var newVersion = pkg.version;
// 	if (semver.gt(newVersion, currentVersion)) {
// 		return true
// 	}
// 	else {
// 		false
// 	}
// }
function plugma(plugin) {
    var pluginState = {
        updateAvailable: false,
        ui: {}
    };
    // console.log(pkg)
    if (pkg === null || pkg === void 0 ? void 0 : pkg.version) {
        pluginState.version = pkg.version;
    }
    // pluginState.updateAvailable = updateAvailable()
    var eventListeners = [];
    var menuCommands = [];
    pluginState.on = (type, callback) => {
        eventListeners.push({ type, callback });
    };
    pluginState.command = (type, callback) => {
        menuCommands.push({ type, callback });
    };
    // Override default page name if set
    var pageMannuallySet = false;
    pluginState.setStartPage = (name) => {
        pluginState.ui.page = name;
        pageMannuallySet = true;
    };
    // pluginState.update = (callback) => {
    // 	for (let [version, changes] of Object.entries(versionHistory)) {
    // 		if (version === pkg.version) {
    // 			// for (let i = 0; i < changes.length; i++) {
    // 			// 	var change = changes[i]
    // 			// }
    // 			callback({ version, changes })
    // 		}
    // 	}
    // }
    var pluginCommands = plugin(pluginState);
    // // Override default page name if set
    // if (pageName[0]) {
    // 	pluginState.ui.page = pageName[0]
    // }
    // console.log("pageName", pluginState.ui.page)
    Object.assign({}, pluginState, { commands: pluginCommands });
    if (pluginCommands) {
        for (let [key, value] of Object.entries(pluginCommands)) {
            // If command exists in manifest
            if (figma.command === key) {
                // Pass default page for ui
                if (!pageMannuallySet) {
                    pluginState.ui.page = key;
                }
                // Override default page name if set
                // if (pageName[0]) {
                // 	pluginState.ui.page = pageName[0]
                // }
                // Call function for that command
                value(pluginState);
                // Show UI?
                if (pluginState.ui.open) {
                    console.log("open?");
                    figma.showUI(pluginState.ui.html);
                }
            }
        }
    }
    figma.ui.onmessage = message => {
        for (let eventListener of eventListeners) {
            // console.log(message)
            if (message.type === eventListener.type)
                eventListener.callback(message);
        }
    };
    pluginState.ui.show = (data) => {
        figma.showUI(pluginState.ui.html, { width: pluginState.ui.width, height: pluginState.ui.height });
        figma.ui.postMessage(data);
    };
    for (let command of menuCommands) {
        if (figma.command === command.type) {
            command.callback(pluginState);
        }
    }
    // console.log(pluginObject)
}

var dist = plugma;

const eventListeners = [];
figma.ui.onmessage = message => {
    for (let eventListener of eventListeners) {
        if (message.action === eventListener.action)
            eventListener.callback(message.data);
    }
};

const nodeProps = [
    'id',
    'parent',
    'name',
    'removed',
    'visible',
    'locked',
    'children',
    'constraints',
    'absoluteTransform',
    'relativeTransform',
    'x',
    'y',
    'rotation',
    'width',
    'height',
    'constrainProportions',
    'layoutAlign',
    'layoutGrow',
    'opacity',
    'blendMode',
    'isMask',
    'effects',
    'effectStyleId',
    'expanded',
    'backgrounds',
    'backgroundStyleId',
    'fills',
    'strokes',
    'strokeWeight',
    'strokeMiterLimit',
    'strokeAlign',
    'strokeCap',
    'strokeJoin',
    'dashPattern',
    'fillStyleId',
    'strokeStyleId',
    'cornerRadius',
    'cornerSmoothing',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
    'exportSettings',
    'overflowDirection',
    'numberOfFixedChildren',
    'overlayPositionType',
    'overlayBackground',
    'overlayBackgroundInteraction',
    'reactions',
    'description',
    'remote',
    'key',
    'layoutMode',
    'primaryAxisSizingMode',
    'counterAxisSizingMode',
    'primaryAxisAlignItems',
    'counterAxisAlignItems',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'paddingBottom',
    'itemSpacing',
    // 'horizontalPadding',
    // 'verticalPadding',
    'layoutGrids',
    'gridStyleId',
    'clipsContent',
    'guides',
    'type'
];
const readOnly = [
    'id',
    'parent',
    'removed',
    'children',
    'absoluteTransform',
    'width',
    'height',
    'overlayPositionType',
    'overlayBackground',
    'overlayBackgroundInteraction',
    'reactions',
    'remote',
    'key',
    'type',
    'masterComponent',
    'mainComponent'
];
// export function copyPaste(source: {} | BaseNode, target: {} | BaseNode)
// export function copyPaste(source: {} | BaseNode, target: {} | BaseNode, options: Options)
// export function copyPaste(source: {} | BaseNode, target: {} | BaseNode, callback: Callback)
// export function copyPaste(source: {} | BaseNode, target: {} | BaseNode, options: Options, callback: Callback)
// export function copyPaste(source: {} | BaseNode, target: {} | BaseNode, callback: Callback, options: Options)
/**
* Allows you to copy and paste props between nodes.
*
* @param source - The node you want to copy from
* @param target - The node or object you want to paste to
* @param args - Either options or a callback.
* @returns A node or object with the properties copied over
*/
function copyPaste(source, target, ...args) {
    var targetIsEmpty;
    if (target && Object.keys(target).length === 0 && target.constructor === Object) {
        targetIsEmpty = true;
    }
    var options;
    if (typeof args[0] === 'function')
        ;
    if (typeof args[1] === 'function')
        ;
    if (typeof args[0] === 'object' && typeof args[0] !== 'function')
        options = args[0];
    if (typeof args[0] === 'object' && typeof args[0] !== 'function')
        options = args[0];
    if (!options)
        options = {};
    const { include, exclude, withoutRelations, removeConflicts } = options;
    // const props = Object.entries(Object.getOwnPropertyDescriptors(source.__proto__))
    let allowlist = nodeProps.filter(function (el) {
        return !readOnly.includes(el);
    });
    if (include) {
        // If include supplied, include copy across these properties and their values if they exist
        allowlist = include.filter(function (el) {
            return !readOnly.includes(el);
        });
    }
    if (exclude) {
        // If exclude supplied then don't copy over the values of these properties
        allowlist = allowlist.filter(function (el) {
            return !exclude.concat(readOnly).includes(el);
        });
    }
    // target supplied, don't copy over the values of these properties
    if (target && !targetIsEmpty) {
        allowlist = allowlist.filter(function (el) {
            return !['id', 'type'].includes(el);
        });
    }
    var obj = {};
    if (targetIsEmpty) {
        if (obj.id === undefined) {
            obj.id = source.id;
        }
        if (obj.type === undefined) {
            obj.type = source.type;
        }
        if (source.key)
            obj.key = source.key;
    }
    const props = Object.entries(Object.getOwnPropertyDescriptors(source.__proto__));
    for (const [key, value] of props) {
        if (allowlist.includes(key)) {
            try {
                if (typeof obj[key] === 'symbol') {
                    obj[key] = 'Mixed';
                }
                else {
                    obj[key] = value.get.call(source);
                }
            }
            catch (err) {
                obj[key] = undefined;
            }
        }
        // Needs building in
        // if (callback) {
        //     callback(obj)
        // }
        // else {
        // }
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
        }
        else {
            delete obj.textStyleId;
        }
        if (obj.cornerRadius !== figma.mixed) {
            delete obj.topLeftRadius;
            delete obj.topRightRadius;
            delete obj.bottomLeftRadius;
            delete obj.bottomRightRadius;
        }
        else {
            delete obj.cornerRadius;
        }
    }
    // Only applicable to objects because these properties cannot be set on nodes
    if (targetIsEmpty) {
        if (source.parent && !withoutRelations) {
            obj.parent = { id: source.parent.id, type: source.parent.type };
        }
    }
    // Only applicable to objects because these properties cannot be set on nodes
    if (targetIsEmpty) {
        if (source.type === "FRAME" || source.type === "COMPONENT" || source.type === "COMPONENT_SET" || source.type === "PAGE" || source.type === 'GROUP' || source.type === 'INSTANCE' || source.type === 'DOCUMENT' || source.type === 'BOOLEAN_OPERATION') {
            if (source.children && !withoutRelations) {
                obj.children = source.children.map((child) => copyPaste(child, {}, { withoutRelations }));
            }
        }
        if (source.type === "INSTANCE") {
            if (source.mainComponent && !withoutRelations) {
                obj.masterComponent = copyPaste(source.mainComponent, {}, { withoutRelations });
            }
        }
    }
    Object.assign(target, obj);
    return obj;
}
/**
 *
 * @param {BaseNode} node  A figma node to set data on
 * @param {String} key A key to store data under
 * @param {any} data Data to be stoed
 */
function setPluginData(node, key, data) {
    node.setPluginData(key, JSON.stringify(data));
}
var copyPaste_1 = copyPaste;
var setPluginData_1 = setPluginData;

var selectionSet = false;
var origSel = figma.currentPage.selection;
var newSel = [];
// Move to helpers
function putValuesIntoArray(value) {
    return Array.isArray(value) ? value : [value];
}
function getPluginData(node, key) {
    var data = node.getPluginData(key);
    if (data)
        return JSON.parse(data);
}
function findComponentById(id) {
    // var pages = figma.root.children
    // var component
    // // Look through each page to see if matches node id
    // for (let i = 0; i < pages.length; i++) {
    // 	if (pages[i].findOne(node => node.id === id && node.type === "COMPONENT")) {
    // 		component = pages[i].findOne(node => node.id === id && node.type === "COMPONENT")
    // 	}
    // }
    // return component || false
    var node = figma.getNodeById(id);
    if (node) {
        if (node.parent === null || node.parent.parent === null) {
            // figma.root.setPluginData("cellComponentState", "exists")
            // If component in storage then restore it
            figma.currentPage.appendChild(node);
            return node;
        }
        else {
            // figma.root.setPluginData("cellComponentState", "removed")
            return node;
        }
    }
    else {
        // figma.root.setPluginData("cellComponentState", "deleted")
        return null;
    }
}
const isPageNode = (node) => {
    return node.type === 'PAGE';
};
const getTopLevelParent = (node) => {
    if (node && node.parent && !isPageNode(node.parent)) {
        return getTopLevelParent(node.parent);
    }
    else {
        return node;
    }
};
function isPartOfInstance(node) {
    const parent = node.parent;
    if (parent.type === 'INSTANCE') {
        return true;
    }
    else if (parent.type === 'PAGE') {
        return false;
    }
    else {
        return isPartOfInstance(parent);
    }
}
function isPartOfComponent(node) {
    const parent = node.parent;
    if (parent.type === 'COMPONENT') {
        return true;
    }
    else if (parent.type === 'PAGE') {
        return false;
    }
    else {
        return isPartOfComponent(parent);
    }
}
function getComponentParent(node) {
    var _a;
    if (node.type === "COMPONENT")
        return node;
    if (node.type === "PAGE")
        return null;
    if (((_a = node === null || node === void 0 ? void 0 : node.parent) === null || _a === void 0 ? void 0 : _a.type) === "COMPONENT") {
        return node.parent;
    }
    else {
        return getComponentParent(node === null || node === void 0 ? void 0 : node.parent);
    }
}
function getSlotParent(node) {
    if (getPluginData(node, "isSlotParent"))
        return node;
    if (node.type === "PAGE")
        return null;
    if (getPluginData(node === null || node === void 0 ? void 0 : node.parent, "isSlotParent")) {
        return node.parent;
    }
    else {
        return getSlotParent(node === null || node === void 0 ? void 0 : node.parent);
    }
}
/**
 * Calculate relative position of node based on provided parent or top level parent.
 * For example:
 * ```js
 * // for structure below
 * // Page / Frame / Group1 / Group2 / Text
 *
 * getRelativePosition(Text, Group1) // will calculate { x, y } based on Group1
 *
 * getRelativePosition(Text) // will calculate { x, y } based on Frame
 * ```
 **/
const getRelativePosition = (node, relativeNode) => {
    relativeNode = relativeNode || getTopLevelParent(node);
    return {
        x: Math.abs(Math.round(relativeNode.absoluteTransform[0][2] - node.absoluteTransform[0][2])),
        y: Math.abs(Math.round(relativeNode.absoluteTransform[1][2] - node.absoluteTransform[1][2]))
    };
};
function getNodeIndex(node) {
    return node.parent.children.indexOf(node);
}
function makeComponent(node, action = "make") {
    var origNode = node;
    var container = node.parent;
    var origNodeIndex = getNodeIndex(node);
    var clonedNode;
    // if (action === "make") {
    // 	const component = node.mainComponent
    // 	component.setRelaunchData({
    // 		'editSlot': 'Edit the selected slot',
    // 		'removeSlot': 'Remove the selected slot'
    // 	})
    // 	node.setRelaunchData({
    // 		'editSlot': 'Edit the selected slot',
    // 		'removeSlot': 'Remove the selected slot'
    // 	})
    // 	setPluginData(component, "isSlot", true)
    // 	setPluginData(node, "isSlot", true)
    // 	figma.currentPage.selection = [node]
    // 	if (action === "make") {
    // 		newSel.push(node)
    // 	}
    // 	return { component }
    // }
    // else {
    // Make unique
    // Create a unique instance by recreating it as a component
    const component = figma.createComponent();
    component.setRelaunchData({
        'editSlot': 'Edit the selected slot',
        'removeSlot': 'Remove the selected slot'
    });
    setPluginData_1(component, "isSlot", true);
    component.resizeWithoutConstraints(node.width, node.height);
    if (node.type === "FRAME" || node.type === "INSTANCE") {
        copyPaste_1(node, component);
        // If it's an instance, it needs to be detached so it's children can be moved to component
        if (node.type === "INSTANCE") {
            clonedNode = node.clone();
            node = clonedNode.detachInstance();
        }
        for (const child of node.children) {
            component.appendChild(child);
        }
        if (action === "edit") {
            if (origNode.type === "INSTANCE") {
                origNode.swapComponent(component);
            }
        }
        // }
        // newSel.push(origNode)
    }
    else {
        // If it's not a frame or instance just add it to container
        if (node.type === "TEXT") {
            component.layoutMode = "VERTICAL";
            if (node.textAutoResize === "HEIGHT") {
                component.primaryAxisSizingMode = "AUTO";
            }
            if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
                component.primaryAxisSizingMode = "AUTO";
                component.counterAxisSizingMode = "AUTO";
            }
            // if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
            // 	height = "hug-contents"
            // 	width = "hug-contents"
            // }
        }
        copyPaste_1(node, component, { include: ['layoutAlign', 'layoutGrow', 'name'] });
        component.appendChild(node);
    }
    if (action === "make") {
        var instance = component.createInstance();
        copyPaste_1(node, instance, { include: ['layoutAlign', 'layoutGrow'] });
        container.insertChild(origNodeIndex, instance);
        if (origNode.type === "INSTANCE" && origNode)
            origNode.remove();
        newSel.push(instance);
    }
    if (node.type === "FRAME") {
        node.remove();
    }
    // for (var i = 0; i < discardNodes.length; i++) {
    // 	var node = discardNodes[i]
    // 	node.remove()
    // }
    component.remove();
    return {
        component, origNode
    };
    // }
    // }
}
var countNumberSlots = 0;
var numberSlots = 0;
function countSlots(nodes) {
    // if (sel.length > 0) {
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (JSON.parse(node.getPluginData("isSlot"))) {
            countNumberSlots += 1;
        }
        if (node.children) {
            countSlots(node.children);
        }
    }
    return countNumberSlots;
}
function removeSlot(node, traverseChildren = true) {
    var nodes = putValuesIntoArray(node);
    // if (sel.length > 0) {
    for (var i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (getPluginData(node, "isSlot")) {
            numberSlots += 1;
            traverseChildren = false;
        }
        // TODO: Better if it removes from main component DONE
        if (node.type === "INSTANCE") {
            node.mainComponent.name = node.mainComponent.name.replace(/<slot>$/, "");
            node.mainComponent.name = node.mainComponent.name.trim();
            node.name = node.name.replace(/<slot>$/, "");
            node.name = node.name.trim();
        }
        // TODO: Count how many slots left before removing relaunch data
        var parentComponent = getComponentParent(node);
        setPluginData_1(node, "isSlot", "");
        if (traverseChildren) {
            if (node.children) {
                removeSlot(node.children);
            }
        }
        // let count = countSlots([parentComponent])
        if (node.id !== (parentComponent === null || parentComponent === void 0 ? void 0 : parentComponent.id)) {
            node.setRelaunchData({});
            // console.log(count)
            // if (count < 1) {
            // 	parentComponent.setRelaunchData({})
            // }
        }
    }
    // }
    return numberSlots;
}
var nSlotsFound = 0;
function editSlot(node) {
    var nodes = putValuesIntoArray(node);
    for (var i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (getPluginData(node, "isSlot")) {
            // console.log(node.name)
            nSlotsFound += 1;
            // node.name.endsWith('<slot>') && node.type === "INSTANCE"
            let nodeOpacity = node.opacity;
            // const handle = figma.notify("Editing slots...", { timeout: 99999999999 })
            let nodeLayoutAlign = node.layoutAlign;
            let nodePrimaryAxisSizingMode = node.primaryAxisSizingMode;
            let nodeCounterAxisSizingMode = node.counterAxisSizingMode;
            node.layoutGrow;
            node.parent;
            let origNodeVisible = node.visible;
            // Trouble with restoring existing main component is that it's not unique and will break in cases where creating instances with slots because it will change the main component of other instances as well. It does however work in the context of when one mastercomponent/instance is used for all other instances. How can you get this to work?
            // var component = findComponentById(node.mainComponent.id)
            // FIXME: Maybe instance is not the same node when new node is made
            let { component } = makeComponent(node, "edit");
            // Set the visibility to hidden if the instance is hidden by default (ie don't show slot)
            component.visible = origNodeVisible;
            // figma.viewport.scrollAndZoomIntoView(component)
            if (selectionSet === false) {
                // console.log("Selection set")
                figma.currentPage.selection = [];
                selectionSet = true;
            }
            if (figma.getNodeById(component.id)) {
                figma.currentPage.appendChild(component);
            }
            function setPosition(node) {
                if (figma.getNodeById(node.id) && figma.getNodeById(component.id)) {
                    var relativePosition = getRelativePosition(node);
                    component.x = getTopLevelParent(node).x + relativePosition.x;
                    component.y = getTopLevelParent(node).y + relativePosition.y;
                }
            }
            setPosition(node);
            setInterval(() => {
                // If component removed by user, then hide the instance
                if (component.parent === null) {
                    // Keep getting error message when changing node visibility
                    node.visible = false;
                }
                // FIXME: positioning
                setPosition(node);
                if (figma.getNodeById(node.id) && figma.getNodeById(component.id)) {
                    component.resize(node.width, node.height);
                    component.layoutAlign = nodeLayoutAlign;
                    component.primaryAxisSizingMode = nodePrimaryAxisSizingMode;
                    component.counterAxisSizingMode = nodeCounterAxisSizingMode;
                }
                // component.resize(node.width, node.height)
                // component.layoutAlign = nodeLayoutAlign
                // component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
            }, 100);
            // To avoid blinking when going to edit
            setTimeout(() => {
                if (figma.getNodeById(node.id)) {
                    node.opacity = 0;
                }
            }, 100);
            figma.on('close', () => {
                if (figma.getNodeById(node.id)) {
                    node.opacity = nodeOpacity;
                    // Probably not needed now that they are applied when resized at set interval
                    // component.layoutAlign = nodeLayoutAlign
                    // component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
                }
                // Need to find component because user may have deleted/undone it
                let freshComponent = findComponentById(component.id);
                if (freshComponent && (freshComponent === null || freshComponent === void 0 ? void 0 : freshComponent.parent) !== null) {
                    if (node.type !== "COMPONENT") {
                        freshComponent.remove();
                    }
                }
                // FIXME: needs some work. Should loop through each node in original selection to see if they still exist
                if (figma.getNodeById(origSel[0].id)) {
                    if (node.type !== "COMPONENT") {
                        figma.currentPage.selection = origSel;
                    }
                }
                // handle.cancel()
            });
        }
        else {
            if (node.children) {
                editSlot(node.children);
            }
        }
    }
    return nSlotsFound;
}
dist((plugin) => {
    plugin.ui = {
        html: __html__,
        width: 268,
        height: 504
    };
    plugin.command('makeSlot', ({ ui, data }) => {
        var sel = figma.currentPage.selection;
        var numberSlotsMade = 0;
        if (countSlots(sel) > 1) {
            figma.closePlugin(`Already contains ${numberSlots} slots`);
        }
        else if (numberSlots === 1) {
            figma.closePlugin(`Already contains ${numberSlots} slot`);
        }
        else {
            for (var i = 0; i < sel.length; i++) {
                var node = sel[i];
                // Cannot make when part of an instance and part of component
                var isAwkward = (isPartOfInstance(node));
                if (getPluginData(node, "isSlot") !== true) {
                    if (!isAwkward && ((isPartOfComponent(node)))) {
                        var parentComponent = getComponentParent(node);
                        if (parentComponent) {
                            setPluginData_1(parentComponent, "isSlotParent", true);
                            parentComponent.setRelaunchData({
                                'editSlot': 'Edit slots on this instance',
                                'removeSlot': 'Remove slots on this instance'
                            });
                        }
                        var { component } = makeComponent(node);
                        component.name = component.name + " <slot>";
                        // newInstance.name = component.name + " <slot>"
                        setPluginData_1(component, "isSlot", true);
                        if (parentComponent) {
                            if (node.type !== "INSTANCE") {
                                component.remove();
                            }
                        }
                        numberSlotsMade += 1;
                    }
                    else {
                        if (isAwkward) {
                            figma.notify("Edit main component to make slot");
                        }
                        else {
                            figma.notify("Slot must be inside a component");
                        }
                    }
                }
                else {
                    figma.notify("Already a slot");
                }
            }
            if (numberSlotsMade > 1) {
                figma.currentPage.selection = newSel;
                figma.notify(`${numberSlotsMade} slots made`);
            }
            else if (numberSlotsMade === 1) {
                figma.currentPage.selection = newSel;
                figma.notify(`${numberSlotsMade} slot made`);
            }
        }
        figma.closePlugin();
    });
    plugin.command('editSlot', ({ ui, data }) => {
        var sel = figma.currentPage.selection;
        if (sel.length > 0) {
            const handle = figma.notify("Editing slots...", { timeout: 99999999999 });
            var nSlotsFound = editSlot(sel);
            if (nSlotsFound > 0) {
                figma.on('close', () => {
                    handle.cancel();
                });
            }
            if (nSlotsFound === 0) {
                handle.cancel();
                figma.closePlugin("No slots found");
            }
        }
        else if (sel.length === 0) {
            figma.closePlugin("Please select a slot or instance with slots");
        }
    });
    plugin.command('removeSlot', () => {
        var nSlotsRemoved = removeSlot(figma.currentPage.selection);
        // Check remaining slots and if none then remove relaunch data from parent component
        for (var i = 0; i < figma.currentPage.selection.length; i++) {
            var node = figma.currentPage.selection[i];
            var parent = getComponentParent(node) || getSlotParent(node);
            // Only way to remove from instance parent as well is to set data when relaunch data added in first place on component so that you know to remove it when its an instance
            if (parent) {
                let count = countSlots([parent]);
                // if (node.id !== parentComponent?.id) {
                // 	node.setRelaunchData({})
                // 	console.log(count)
                if (count < 1) {
                    parent.setRelaunchData({});
                }
                // }
            }
        }
        if (nSlotsRemoved > 1) {
            figma.closePlugin(`${nSlotsRemoved} slots removed`);
        }
        else if (nSlotsRemoved === 1) {
            figma.closePlugin(`${nSlotsRemoved} slot removed`);
        }
        else {
            figma.closePlugin(`No slots found`);
        }
        figma.closePlugin();
    });
});
// 	plugin.command('createSlot', ({ ui, data }) => {
// 		figma.notify("Command run")
// 					// ui.show(
// 					// 	{
// 					// 		type: "create-table",
// 					// 		...res,
// 					// 		usingRemoteTemplate: getPluginData(figma.root, "usingRemoteTemplate"),
// 					// 		defaultTemplate: getPluginData(figma.root, 'defaultTemplate'),
// 					// 		remoteFiles: getPluginData(figma.root, 'remoteFiles'),
// 					// 		localTemplates: getPluginData(figma.root, 'localTemplates'),
// 					// 		fileId: getPluginData(figma.root, 'fileId'),
// 					// 		pluginAlreadyRun: pluginAlreadyRun,
// 					// 		recentFiles: recentFiles
// 					// 	})
// 	})
// 	// Listen for events from UI
// 	// plugin.on('to-create-table', (msg) => {
// 	// 	figma.clientStorage.getAsync('userPreferences').then((res) => {
// 	// 		plugin.ui.show({ type: "create-table", ...res, defaultTemplate: getPluginData(figma.root, 'defaultTemplate'), remoteFiles: getPluginData(figma.root, 'remoteFiles'), localTemplates: getPluginData(figma.root, 'localTemplates'), fileId: getPluginData(figma.root, 'fileId') })
// 	// 	})
// 	// })
// })
