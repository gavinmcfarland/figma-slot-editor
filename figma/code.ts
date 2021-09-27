import plugma from 'plugma'

// TODO: Add a warning if selection contains slots? DONE

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
// TODO: Check if mainComponent deleted and if so, remove instance DONE/ERROR can't fix
// FIXME: If slots are invisible then don't show when editing? DONE

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
	if (node.type === "COMPONENT") return node
	if (node.type === "PAGE") return null
	if (node?.parent?.type === "COMPONENT") {
		return node.parent
	}
	else {
		return getComponentParent(node?.parent)
	}
}


function getSlotParent(node) {
	if (getPluginData(node, "isSlotParent")) return node
	if (node.type === "PAGE") return null
	if (getPluginData(node?.parent, "isSlotParent")) {
		return node.parent
	}
	else {
		return getSlotParent(node?.parent)
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


	var origNode = node
	var container = node.parent
	var origNodeIndex = getNodeIndex(node)
	var clonedNode;
	var discardNodes = []

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
	const component = figma.createComponent()

	component.setRelaunchData({
		'editSlot': 'Edit the selected slot',
		'removeSlot': 'Remove the selected slot'
	})

	setPluginData(component, "isSlot", true)
	component.resizeWithoutConstraints(node.width, node.height)


	if (node.type === "FRAME" || node.type === "INSTANCE") {

		copyPaste(node, component)

		// If it's an instance, it needs to be detached so it's children can be moved to component
		if (node.type === "INSTANCE") {
			clonedNode = node.clone()
			clonedNode.name = clonedNode.name + " clone"
			node = clonedNode.detachInstance()

		}
		for (const child of node.children) {
			component.appendChild(child)
		}

		if (action === "edit") {
			if (origNode.type === "INSTANCE") {
				origNode.swapComponent(component)
			}
		}

		// }

		// newSel.push(origNode)


	}
	else {

		// If it's not a frame or instance just add it to container

		if (node.type === "TEXT") {
			component.layoutMode = "VERTICAL"
			if (node.textAutoResize === "HEIGHT") {
				component.primaryAxisSizingMode = "AUTO"
			}

			if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
				component.primaryAxisSizingMode = "AUTO"
				component.counterAxisSizingMode = "AUTO"
			}

			// if (node.textAutoResize === "WIDTH_AND_HEIGHT") {
			// 	height = "hug-contents"
			// 	width = "hug-contents"
			// }

		}
		copyPaste(node, component, { include: ['layoutAlign', 'layoutGrow', 'name'] })
		component.appendChild(node)
	}

	if (action === "make") {
		var instance = component.createInstance()
		container.insertChild(origNodeIndex, instance)
		if (origNode.type === "INSTANCE" && origNode) origNode.remove()
		newSel.push(instance)
	}

	if (action !== "edit") {
// Create new instance and replace with existing one
	// var instance = component.createInstance()


	// If have to create a new container then copy the layout properties across to the instance
	// if (!(node.type === "FRAME" || node.type === "INSTANCE")) {
	// 	copyPaste(node, instance, { include: ['layoutAlign', 'layoutGrow', 'primaryAxisSizingMode', 'counterAxisSizingMode'] })
	// }

	// if (origNode.type === "INSTANCE") {
	// 	instance = origNode.swapComponent(component)
	// }

	// if (action === "make") {
	// 	container.insertChild(origNodeIndex, instance)
	// }
		// if (action === "make") {
		// 	newSel.push(instance)
		// }
		// }

		// newSel.push(instance)



		// console.log(node.name)

		// if (node.type === "FRAME" || node.type === "INSTANCE") {

		// }

		// node.remove()

		// if (tempNode) {
		// 	instance.remove()
		// }


		// console.log(node.name)
	}

	if (node.type === "FRAME") {
		node.remove()
	}


	// for (var i = 0; i < discardNodes.length; i++) {
	// 	var node = discardNodes[i]
	// 	node.remove()
	// }


	component.remove()


		return {
			component, origNode
		}
		// }
	// }

}


var countNumberSlots = 0
var numberSlots = 0

function countSlots(nodes) {

	// if (sel.length > 0) {
	for (var i = 0; i < nodes.length; i++) {

		var node = nodes[i]

		if (JSON.parse(node.getPluginData("isSlot"))) {
			countNumberSlots += 1
		}
		if (node.children) {
			countSlots(node.children)
		}
	}

	return countNumberSlots


}

function removeSlot(node, traverseChildren = true) {

	var origSel = node
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

			// TODO: Count how many slots left before removing relaunch data
			var parentComponent = getComponentParent(node)


			setPluginData(node, "isSlot", "")

			if (traverseChildren) {
				if (node.children) {
					removeSlot(node.children)
				}
			}

			// let count = countSlots([parentComponent])

			if (node.id !== parentComponent?.id) {
				node.setRelaunchData({})

				// console.log(count)
				// if (count < 1) {
				// 	parentComponent.setRelaunchData({})
				// }
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
			let nodeOrigParent = node.parent
			let origNodeVisible = node.visible


			// Trouble with restoring existing main component is that it's not unique and will break in cases where creating instances with slots because it will change the main component of other instances as well. It does however work in the context of when one mastercomponent/instance is used for all other instances. How can you get this to work?
			// var component = findComponentById(node.mainComponent.id)

			// FIXME: Maybe instance is not the same node when new node is made
			let { component } = makeComponent(node, "edit")

			// Set the visibility to hidden if the instance is hidden by default (ie don't show slot)
			component.visible = origNodeVisible


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


					// If component removed by user, then hide the instance
					if (component.parent === null) {
						// Keep getting error message when changing node visibility
						node.visible = false
					}


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



		if (countSlots(sel) > 1) {
			figma.closePlugin(`Already contains ${numberSlots} slots`)
		}
		else if (numberSlots === 1) {
			figma.closePlugin(`Already contains ${numberSlots} slot`)
		}
		else {
			for (var i = 0; i < sel.length; i++) {
				var node = sel[i]

				// Cannot make when part of an instance and part of component
				var isAwkward = (isPartOfInstance(node))

				if (getPluginData(node, "isSlot") !== true) {

					if (!isAwkward && ((isPartOfComponent(node)))) {




						var parentComponent = getComponentParent(node)

						if (parentComponent) {
							setPluginData(parentComponent, "isSlotParent", true)
							parentComponent.setRelaunchData({
								'editSlot': 'Edit slots on this instance',
								'removeSlot': 'Remove slots on this instance'
							})
						}

						var { component } = makeComponent(node)



						component.name = component.name + " <slot>"
						// newInstance.name = component.name + " <slot>"

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
							figma.notify("Slot must be inside a component")
						}

					}
				}
				else {
					figma.notify("Already a slot")
				}

			}



			if (numberSlotsMade > 1) {
				figma.currentPage.selection = newSel
				figma.notify(`${numberSlotsMade} slots made`)

			}
			else if (numberSlotsMade === 1) {
				figma.currentPage.selection = newSel
				figma.notify(`${numberSlotsMade} slot made`)

			}
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
			figma.closePlugin("Please select a slot or instance with slots")
		}


	})

	plugin.command('removeSlot', () => {
		var nSlotsRemoved = removeSlot(figma.currentPage.selection)

		// Check remaining slots and if none then remove relaunch data from parent component
		for (var i = 0; i < figma.currentPage.selection.length; i++) {
			var node = figma.currentPage.selection[i]
			var parent = getComponentParent(node) || getSlotParent(node)

			// Only way to remove from instance parent as well is to set data when relaunch data added in first place on component so that you know to remove it when its an instance
			if (parent) {
				let count = countSlots([parent])

				// if (node.id !== parentComponent?.id) {
				// 	node.setRelaunchData({})

				// 	console.log(count)
				if (count < 1) {
					parent.setRelaunchData({})
				}
			// }
			}

		}


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

