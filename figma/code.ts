import plugma from 'plugma'

// TODO: Disable making slot when part of instance NO
// TODO: Only allow making slots on frames and top level instances inside of components? NO
// TODO: Detect if slot already made DONE
// TODO: Let plugin work even when instance deleted DONE

import { setPluginData, updatePluginData, updateClientStorageAsync, copyPaste, removeChildren, getClientStorageAsync, ungroup, setClientStorageAsync} from '@figlets/helpers'

var selectionSet = false
var origSel = figma.currentPage.selection
var newSel = []

// Move to helpers

function putValuesIntoArray(value) {
	return Array.isArray(value) ? value : [value]
}

function getPluginData(node: BaseNode, key: string) {
	var data = node.getPluginData(key)
	if (data) return JSON.parse(data)
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

	var node = figma.getNodeById(id)



	if (node) {
		if (node.parent === null || node.parent.parent === null) {
			// figma.root.setPluginData("cellComponentState", "exists")
			// If component in storage then restore it
			figma.currentPage.appendChild(node)
			return node
		}
		else {
			// figma.root.setPluginData("cellComponentState", "removed")
			return node
		}
	}
	else {
		// figma.root.setPluginData("cellComponentState", "deleted")
		return null
	}

}

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

function isPartOfInstance(node: SceneNode): boolean {
	const parent = node.parent
	if (parent.type === 'INSTANCE') {
		return true
	} else if (parent.type === 'PAGE') {
		return false
	} else {
		return isPartOfInstance(parent as SceneNode)
	}
}

function findTopInstance(node) {
	if (node.type === "PAGE") return null
	if (isPartOfInstance(node)) {
		return findTopInstance(node.parent)
	} else {
		return node
	}
}

function getComponentParent(node) {
	if (node.type === "PAGE") return null
	if (node?.parent?.type === "COMPONENT") {
		return node.parent
	}
	else {
		return getComponentParent(node?.parent)
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

function makeComponent(node, action = "make") {

	if (node.type === "INSTANCE" && action === "make") {
		const component = node.mainComponent

		component.setRelaunchData({
			'editSlot': 'Edit the selected slot',
			'removeSlot': 'Remove the selected slot'
		})

		node.setRelaunchData({
			'editSlot': 'Edit the selected slot',
			'removeSlot': 'Remove the selected slot'
		})

		setPluginData(component, "isSlot", true)
		setPluginData(node, "isSlot", true)
		figma.currentPage.selection = [node]

		if (action === "make") {
			newSel.push(node)
		}

		return component

	}
	else {

		// Make unique
		const component = figma.createComponent()

		component.setRelaunchData({
			'editSlot': 'Edit the selected slot',
			'removeSlot': 'Remove the selected slot'
		})
		setPluginData(component, "isSlot", true)
		// Add relaunch data to top level component of slot

		var origNode = node

		if (node.type === "INSTANCE") {
			node = node.clone().detachInstance()

		}

		component.resizeWithoutConstraints(node.width, node.height)

		copyPaste(node, component)

		for (const child of node.children) {
			component.appendChild(child)
		}




		if (origNode.type === "INSTANCE") {
			origNode.swapComponent(component)

			if (action === "make") {
				newSel.push(origNode)
			}
		}
		else {
			var instance = component.createInstance()
			node.parent.insertChild(getNodeIndex(node), instance)
			if (action === "make") {
				newSel.push(instance)
			}
		}




		node.remove()


		return component
	}

}

function removeSlot(node, level = 0, nSlots = 0) {
	var sel = putValuesIntoArray(node)

	if (sel.length > 0) {
		for (var i = 0; i < sel.length; i++) {

			var node = sel[i]

			if (getPluginData(node, "isSlot")) {
				nSlots += 1
			}

			setPluginData(node, "isSlot", "")

			node.setRelaunchData({})


			// TODO: Better if it removes from main component

			node.name = node.name.replace(/<slot>$/, "")

			if (level === 0) {
				if ((node.type === "INSTANCE" || node.type === "COMPONENT") && node.children) {

					level += 1
					return removeSlot(node.children, level, nSlots)
				}
			}
		}
	}

	return nSlots
}



function editSlot(node) {

	if (getPluginData(node, "isSlot")) {


		// node.name.endsWith('<slot>') && node.type === "INSTANCE"

		var nodeOpacity = node.opacity
		const handle = figma.notify("Editing slots...", { timeout: 99999999999 })
		var nodeLayoutAlign = node.layoutAlign
		var nodePrimaryAxisSizingMode = node.primaryAxisSizingMode

		// Trouble with restoring existing main component is that it's not unique and will break in cases where creating instances with slots because it will change the main component of other instances as well. It does however work in the context of when one mastercomponent/instance is used for all other instances. How can you get this to work?
		// var component = findComponentById(node.mainComponent.id)

		var component = makeComponent(node, "edit")


		// figma.viewport.scrollAndZoomIntoView(component)

		if (selectionSet === false) {
			console.log("Selection set")
			figma.currentPage.selection = [component]
			selectionSet = true
		}

		figma.currentPage.appendChild(component)


		function setPosition(node) {
			if (figma.getNodeById(node.id)) {
				var relativePosition = getRelativePosition(node)
				component.x = getTopLevelParent(node).x + relativePosition.x
				component.y = getTopLevelParent(node).y + relativePosition.y
			}

		}

		setPosition(node)


		setInterval(() => {

			setPosition(node)
			// component.resize(node.width, node.height)
			// component.layoutAlign = nodeLayoutAlign
			// component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
		}, 200)


		// figma.on('selectionchange', () => {
		// 	if (figma.currentPage.selection[0]?.id === findTopInstance(origSelection)?.id) {
		// 		console.log("Selection is top instance")
		// 		setInterval(() => {
		// 			component.resize(node.width, node.height)
		// 			component.layoutAlign = nodeLayoutAlign
		// 			component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
		// 		}, 100)
		// 	}
		// 	else {
		// 		console.log("Selection is not top instance")
		// 	}
		// })


		setInterval(() => {
			if (figma.getNodeById(node.id)) {
				component.resize(node.width, node.height)
				component.layoutAlign = nodeLayoutAlign
				component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
			}
		}, 100)



		// To avoid blinking when going to edit
		setTimeout(() => {
			if (figma.getNodeById(node.id)) {
				node.opacity = 0
			}
		}, 100)


		figma.on('close', () => {
			handle.cancel()
			if (figma.getNodeById(node.id)) {
				node.opacity = nodeOpacity
				// Probably not needed now that they are applied when resized at set interval
				// component.layoutAlign = nodeLayoutAlign
				// component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
			}
			component.remove()
			if (figma.getNodeById(origSel[0].id)) {
				figma.currentPage.selection = origSel
			}

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

	plugin.command('makeSlot', ({ ui, data }) => {

		var sel = figma.currentPage.selection
		var numberSlotsMade = 0

		for (var i = 0; i < sel.length; i++) {
			var node = sel[i]
			console.log(getPluginData(node, "isSlot"))
			if (getPluginData(node, "isSlot") !== true) {
				if (node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT") {
					node.name = node.name + " <slot>"



					var parentComponent = getComponentParent(node)

					parentComponent.setRelaunchData({
						'editSlot': 'Edit slots on this instance',
						'removeSlot': 'Remove slots on this instance'
					})


					var component = makeComponent(node)

					setPluginData(component, "isSlot", true)

					if (node.type !== "INSTANCE") {
						component.remove()
					}

					numberSlotsMade += 1
				}
				else {
					figma.notify("Slot must be a frame, component or instance")
				}
			}
			else {
				figma.notify("Already a slot")
			}

		}

		console.log(numberSlotsMade)

		if (numberSlotsMade > 1) {
			figma.currentPage.selection = newSel
			figma.notify("Slots made")

		}
		else if (numberSlotsMade === 1) {
			figma.currentPage.selection = newSel
			figma.notify("Slot made")

		}

		figma.closePlugin()


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

	plugin.command('removeSlot', () => {
		var nSlotsRemoved = removeSlot(figma.currentPage.selection)

		if (nSlotsRemoved > 1) {
			figma.closePlugin(`${nSlotsRemoved} slots removed`)
		}

		else if (nSlotsRemoved === 1) {
			figma.closePlugin(`${nSlotsRemoved} slot removed`)
		}


		figma.closePlugin()


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

