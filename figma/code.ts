import plugma from 'plugma'

// FIXME: When no selection when editing DONE
// FIXME: When no slots when editing DONE
// FIXME: When trying to turn something inside instances into slot NOT NEEDED
// FIXME: Enable editing more than one instance at a time DONE
// FIXME: Stops editing after first go DONE

// TODO: Disable making slot when part of instance inside a component
// TODO: Only allow making slots on frames and top level instances inside of components? NO
// TODO: Detect if slot already made DONE
// TODO: Let plugin work even when instance deleted DONE

// TODO: Do unit tests again
// TODO: Check if happy with way selection works
// FIXME: Give warning to user when trying to edit slot which has been detached
// TODO: Hide grids on instances when editing and lock them?
// TODO: Check if mainComponent deleted and if so, remove instance

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

function isPartOfComponent(node: SceneNode): boolean {
	const parent = node.parent
	if (parent.type === 'COMPONENT') {
		return true
	} else if (parent.type === 'PAGE') {
		return false
	} else {
		return isPartOfComponent(parent as SceneNode)
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

var numberSlots = 0

function removeSlot(node, traverseChildren = true) {
	var nodes = putValuesIntoArray(node)

	// if (sel.length > 0) {
		for (var i = 0; i < nodes.length; i++) {

			var node = nodes[i]

			if (getPluginData(node, "isSlot")) {
				numberSlots += 1
				traverseChildren = false
			}

			// TODO: Better if it removes from main component

			node.name = node.name.replace(/<slot>$/, "")
			node.setRelaunchData({})
			setPluginData(node, "isSlot", "")

			if (traverseChildren) {
				if (node.children) {
					removeSlot(node.children)
				}
			}




		}
	// }

	return numberSlots
}

var nSlotsFound = 0

function editSlot(node) {
	var nodes = putValuesIntoArray(node)

	for (var i = 0; i < nodes.length; i++) {
		let node = nodes[i]

		if (getPluginData(node, "isSlot")) {
			// console.log(node.name)

			nSlotsFound += 1

			// node.name.endsWith('<slot>') && node.type === "INSTANCE"

			let nodeOpacity = node.opacity
			// const handle = figma.notify("Editing slots...", { timeout: 99999999999 })
			let nodeLayoutAlign = node.layoutAlign
			let nodePrimaryAxisSizingMode = node.primaryAxisSizingMode

			// Trouble with restoring existing main component is that it's not unique and will break in cases where creating instances with slots because it will change the main component of other instances as well. It does however work in the context of when one mastercomponent/instance is used for all other instances. How can you get this to work?
			// var component = findComponentById(node.mainComponent.id)

			let component = makeComponent(node, "edit")


			// figma.viewport.scrollAndZoomIntoView(component)

			if (selectionSet === false) {
				// console.log("Selection set")
				figma.currentPage.selection = []
				selectionSet = true
			}

			if (figma.getNodeById(component.id)) {
				figma.currentPage.appendChild(component)
			}



			function setPosition(node) {
				if (figma.getNodeById(node.id) && figma.getNodeById(component.id)) {
					var relativePosition = getRelativePosition(node)
					component.x = getTopLevelParent(node).x + relativePosition.x
					component.y = getTopLevelParent(node).y + relativePosition.y
				}

			}

			setPosition(node)


			setInterval(() => {

				// FIXME: positioning
				setPosition(node)
				if (figma.getNodeById(node.id) && figma.getNodeById(component.id)) {
					component.resize(node.width, node.height)
					component.layoutAlign = nodeLayoutAlign
					component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
				}
				// component.resize(node.width, node.height)
				// component.layoutAlign = nodeLayoutAlign
				// component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
			}, 200)

			// To avoid blinking when going to edit
			setTimeout(() => {
				if (figma.getNodeById(node.id)) {
					node.opacity = 0
				}
			}, 100)

			figma.on('close', () => {

				if (figma.getNodeById(node.id)) {
					node.opacity = nodeOpacity
					// Probably not needed now that they are applied when resized at set interval
					// component.layoutAlign = nodeLayoutAlign
					// component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
				}

				// Need to find component because user may have deleted/undone it
				let freshComponent = findComponentById(component.id)
				if (freshComponent && freshComponent?.parent !== null) {
					if (node.type !== "COMPONENT") {
						freshComponent.remove()
					}
				}

				// FIXME: needs some work. Should loop through each node in original selection to see if they still exist
				if (figma.getNodeById(origSel[0].id)) {
					if (node.type !== "COMPONENT") {
						figma.currentPage.selection = origSel
					}
				}

				// handle.cancel()

			})
		}
		else {
			if (node.children) {
					editSlot(node.children)
			}

		}
	}

	return nSlotsFound
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

			// Cannot make when part of an instance and part of component
			var isAwkward = isPartOfInstance(node) && isPartOfComponent(node) && node.type !== "INSTANCE"

			if (getPluginData(node, "isSlot") !== true) {

				if (!isAwkward && ((node.type === "FRAME" || node.type === "INSTANCE") && (isPartOfComponent(node)))) {
					node.name = node.name + " <slot>"



					var parentComponent = getComponentParent(node)

					if (parentComponent) {
						parentComponent.setRelaunchData({
							'editSlot': 'Edit slots on this instance',
							'removeSlot': 'Remove slots on this instance'
						})
					}

					var component = makeComponent(node)

					setPluginData(component, "isSlot", true)

					if (parentComponent) {

						if (node.type !== "INSTANCE") {
							component.remove()
						}

					}

					numberSlotsMade += 1
				}
				else {
					if (isAwkward) {
						figma.notify("Edit main component to make slot")
					}
					else {
						figma.notify("Slot must be a frame or instance inside a component")
					}

				}
			}
			else {
				figma.notify("Already a slot")
			}

		}

		console.log(numberSlotsMade)

		if (numberSlotsMade > 1) {
			figma.currentPage.selection = newSel
			figma.notify(`${numberSlotsMade} slots made`)

		}
		else if (numberSlotsMade === 1) {
			figma.currentPage.selection = newSel
			figma.notify(`${numberSlotsMade} slot made`)

		}

		figma.closePlugin()


	})

	plugin.command('editSlot', ({ ui, data }) => {

		var sel = figma.currentPage.selection



		if (sel.length > 0) {
			const handle = figma.notify("Editing slots...", { timeout: 99999999999 })
			var nSlotsFound = editSlot(sel)

			if (nSlotsFound > 0) {

				figma.on('close', () => {
					handle.cancel()
				})
			}
			if (nSlotsFound === 0) {
				handle.cancel()
				figma.closePlugin("No slots found")
			}

		}
		else if (sel.length === 0) {
			figma.notify("Please select a slot or instance with slots")
		}


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

