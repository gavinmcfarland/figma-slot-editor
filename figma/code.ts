import plugma from 'plugma'

import { setPluginData, updatePluginData, updateClientStorageAsync, copyPaste, removeChildren, getClientStorageAsync, ungroup, setClientStorageAsync } from '@figlets/helpers'

// Move to helpers

const isPageNode = (node: BaseNode): node is PageNode => {
	return node.type === 'PAGE'
}

const getTopLevelParent = (node: BaseNode): BaseNode => {
	if (node && node.parent && !isPageNode(node.parent)) {
		return getTopLevelParent(node.parent)
	} else {
		return node
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
const getRelativePosition = (
	node: BaseNode & LayoutMixin,
	relativeNode?: BaseNode & LayoutMixin
) => {
	relativeNode = relativeNode || (getTopLevelParent(node) as BaseNode & LayoutMixin)
	return {
		x: Math.abs(
			Math.round(relativeNode.absoluteTransform[0][2] - node.absoluteTransform[0][2])
		),
		y: Math.abs(Math.round(relativeNode.absoluteTransform[1][2] - node.absoluteTransform[1][2]))
	}
}

function getNodeIndex(node: SceneNode): number {
	return node.parent.children.indexOf(node)
}

function makeComponent(node) {
	const component = figma.createComponent()

	var origNode = node

	if (node.type === "INSTANCE") {
		node = node.clone().detachInstance()

	}

	component.resizeWithoutConstraints(node.width, node.height)

	copyPaste(node, component)

	// component.x = node.x + 200
	// component.y = node.y + 200

	for (const child of node.children) {
		component.appendChild(child)
	}




	if (origNode.type === "INSTANCE") {
		origNode.swapComponent(component)
	}
	else {
		var instance = component.createInstance()
		node.parent.insertChild(getNodeIndex(node), instance)
	}


	node.remove()




	return component
}

function editSlot(node) {

	if (node.name.endsWith('<slot>')) {
		const handle = figma.notify("Editing slot", {timeout: 999999999})



		// var component = sel.mainComponent

		var component = makeComponent(node)
		node.opacity = 0

		// figma.viewport.scrollAndZoomIntoView(component)

		figma.currentPage.appendChild(component)


		setInterval(() => {
			// Set position on document
			var relativePosition = getRelativePosition(node)
			component.x = getTopLevelParent(node).x + relativePosition.x
			component.y = getTopLevelParent(node).y + relativePosition.y
		}, 100)


		figma.on('close', () => {
			handle.cancel()
			node.opacity = 1
			component.remove()
		})
	}
	else {
		if (node.children) {
			var length = node.children.length

			for (var i = 0; i < length; i++) {
				var child = node.children[i]
				editSlot(child)
			}
		}

	}
}

plugma((plugin) => {

	plugin.ui = {
		html: __html__,
		width: 268,
		height: 504
	}

	plugin.command('createSlot', ({ ui, data }) => {

		var sel = figma.currentPage.selection[0]

		sel.name = sel.name + " <slot>"

		var component = makeComponent(sel)

		console.log(component)

		component.remove()


		// Create component from selection
		// Replace selection with instance of component
		// Delete component

		figma.closePlugin("Slot created")

					// ui.show(
					// 	{
					// 		type: "create-table",
					// 		...res,
					// 		usingRemoteTemplate: getPluginData(figma.root, "usingRemoteTemplate"),
					// 		defaultTemplate: getPluginData(figma.root, 'defaultTemplate'),
					// 		remoteFiles: getPluginData(figma.root, 'remoteFiles'),
					// 		localTemplates: getPluginData(figma.root, 'localTemplates'),
					// 		fileId: getPluginData(figma.root, 'fileId'),
					// 		pluginAlreadyRun: pluginAlreadyRun,
					// 		recentFiles: recentFiles
					// 	})

	})

	plugin.command('editSlot', ({ ui, data }) => {

		var sel = figma.currentPage.selection[0]

		editSlot(sel)


		// Create component from selection
		// Replace selection with instance of component
		// Delete component





		// ui.show(
		// 	{
		// 		type: "create-table",
		// 		...res,
		// 		usingRemoteTemplate: getPluginData(figma.root, "usingRemoteTemplate"),
		// 		defaultTemplate: getPluginData(figma.root, 'defaultTemplate'),
		// 		remoteFiles: getPluginData(figma.root, 'remoteFiles'),
		// 		localTemplates: getPluginData(figma.root, 'localTemplates'),
		// 		fileId: getPluginData(figma.root, 'fileId'),
		// 		pluginAlreadyRun: pluginAlreadyRun,
		// 		recentFiles: recentFiles
		// 	})



	})


})



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

