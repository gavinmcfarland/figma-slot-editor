// FIXME: When trying to turn something inside instances into slot NOT NEEDED

// TODO: Disable making slot when part of instance inside a component
// TODO: Only allow making slots on frames and top level instances inside of components? NO

// TODO: Check if happy with way selection works
// FIXME: Give warning to user when trying to edit slot which has been detached
// TODO: Hide grids on instances when editing and lock them?
// TODO: Check if mainComponent deleted and if so, remove instance DONE/ERROR can't fix

import { setPluginData, copyPaste } from '@figlets/helpers'

const origSel = figma.currentPage.selection
const newSel = []

let selectionSet = false
let countNumberSlots = 0
let numberSlots = 0
let nSlotsFound = 0

function putValuesIntoArray(value) {
	return Array.isArray(value) ? value : [value]
}

function getPluginData(node: BaseNode, key: string) {
	const data = node.getPluginData(key)
	if (data) return JSON.parse(data)
}

function findComponentById(id) {
	const node = figma.getNodeById(id)

	if (node) {
		if (node.parent === null || node.parent.parent === null) {
			if ('appendChild' in figma.currentPage && node.type !== 'PAGE') {
				figma.currentPage.appendChild(node as SceneNode)
				return node as SceneNode
			} else {
				return node
			}
		} else {
			return node
		}
	} else {
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

function getComponentParent(node) {
	if (node.type === 'COMPONENT') return node
	if (node.type === 'PAGE') return null
	if (node?.parent?.type === 'COMPONENT') {
		return node.parent
	} else {
		return getComponentParent(node?.parent)
	}
}

function getSlotParent(node) {
	if (getPluginData(node, 'isSlotParent')) return node
	if (node.type === 'PAGE') return null
	if (getPluginData(node?.parent, 'isSlotParent')) {
		return node.parent
	} else {
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
	relativeNode?: BaseNode & LayoutMixin,
) => {
	relativeNode =
		relativeNode || (getTopLevelParent(node) as BaseNode & LayoutMixin)
	return {
		x: Math.abs(
			Math.round(
				relativeNode.absoluteTransform[0][2] -
					node.absoluteTransform[0][2],
			),
		),
		y: Math.abs(
			Math.round(
				relativeNode.absoluteTransform[1][2] -
					node.absoluteTransform[1][2],
			),
		),
	}
}

function getNodeIndex(node: SceneNode): number {
	return node.parent.children.indexOf(node)
}

function setPosition(node, component) {
	if (figma.getNodeById(node.id) && figma.getNodeById(component.id)) {
		const relativePosition = getRelativePosition(node)
		component.x = getTopLevelParent(node).x + relativePosition.x
		component.y = getTopLevelParent(node).y + relativePosition.y
	}
}

function makeComponent(node, action = 'make') {
	const origNode = node
	const container = node.parent
	const origNodeIndex = getNodeIndex(node)
	let clonedNode

	// Make unique
	// Create a unique instance by recreating it as a component
	const component = figma.createComponent()

	component.setRelaunchData({
		editSlot: 'Edit the selected slot',
		removeSlot: 'Remove the selected slot',
	})

	setPluginData(component, 'isSlot', true)
	component.resizeWithoutConstraints(node.width, node.height)

	if (node.type === 'FRAME' || node.type === 'INSTANCE') {
		copyPaste(node, component)

		// If it's an instance, it needs to be detached so it's children can be moved to component

		if (node.type === 'INSTANCE') {
			clonedNode = node.clone()
			node = clonedNode.detachInstance()
		}

		console.log('-----', node.name, component)

		// Move children of clonedNode over to component
		for (const child of node.children) {
			component.appendChild(child)
		}

		if (action === 'edit') {
			if (origNode.type === 'INSTANCE') {
				origNode.swapComponent(component)
			}
		}
	} else {
		// If it's not a frame or instance just add it to container

		if (node.type === 'TEXT') {
			component.layoutMode = 'VERTICAL'
			if (node.textAutoResize === 'HEIGHT') {
				component.primaryAxisSizingMode = 'AUTO'
			}

			if (node.textAutoResize === 'WIDTH_AND_HEIGHT') {
				component.primaryAxisSizingMode = 'AUTO'
				component.counterAxisSizingMode = 'AUTO'
			}
		}
		copyPaste(node, component, {
			include: ['layoutAlign', 'layoutGrow', 'name', 'x', 'y'],
		})

		component.appendChild(node)
	}

	if (action === 'make') {
		const instance = component.createInstance()
		copyPaste(node, instance, {
			include: ['layoutAlign', 'layoutGrow', 'constraints', 'x', 'y'],
		})
		node.x = 0
		node.y = 0
		container.insertChild(origNodeIndex, instance)
		if (origNode.type === 'INSTANCE' && origNode) origNode.remove()
		newSel.push(instance)
	}

	if (node.type === 'FRAME') {
		node.remove()
	}

	component.remove()

	return {
		component,
		origNode,
	}
}

function countSlots(nodes) {
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]

		if (getPluginData(node, 'isSlot')) {
			countNumberSlots += 1
		}
		if (node.children) {
			countSlots(node.children)
		}
	}

	console.log(countNumberSlots)

	return countNumberSlots
}

function removeSlot(node, traverseChildren = true) {
	const nodes = putValuesIntoArray(node)

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]

		if (getPluginData(node, 'isSlot')) {
			numberSlots += 1
			traverseChildren = false
		}

		// TODO: Better if it removes from main component DONE

		if (node.type === 'INSTANCE') {
			// console.log(node.mainComponent.name.replace(/<slot>$/, ""))
			let newName
			newName = node.mainComponent.name.replace(/<slot>$/, '')
			newName = newName.trim()
			if (newName !== node.mainComponent.name) {
				node.mainComponent.name = newName
			}

			// node.mainComponent.name = node.mainComponent.name.replace(/<slot>$/, "")
			// node.mainComponent.name = node.mainComponent.name.trim()
			node.name = node.name.replace(/<slot>$/, '')
			node.name = node.name.trim()
		}

		// TODO: Count how many slots left before removing relaunch data
		const parentComponent = getComponentParent(node)

		setPluginData(node, 'isSlot', '')

		if (traverseChildren) {
			if (node.children) {
				removeSlot(node.children)
			}
		}

		if (node.id !== parentComponent?.id) {
			node.setRelaunchData({})
		}
	}

	return numberSlots
}

function editSlot(node) {
	const nodes = putValuesIntoArray(node)

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]

		if (getPluginData(node, 'isSlot') && node.type === 'INSTANCE') {
			// console.log(node.name)

			nSlotsFound += 1

			// node.name.endsWith('<slot>') && node.type === "INSTANCE"

			const nodeOpacity = node.opacity
			// const handle = figma.notify("Editing slots...", { timeout: 99999999999 })
			const nodeLayoutAlign = node.layoutAlign
			const nodePrimaryAxisSizingMode = node.primaryAxisSizingMode
			const nodeCounterAxisSizingMode = node.counterAxisSizingMode
			const origNodeVisible = node.visible

			// Trouble with restoring existing main component is that it's not unique and will break in cases where creating instances with slots because it will change the main component of other instances as well. It does however work in the context of when one mastercomponent/instance is used for all other instances. How can you get this to work?
			// var component = findComponentById(node.mainComponent.id)

			// FIXME: Maybe instance is not the same node when new node is made
			const { component } = makeComponent(node, 'edit')

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

			setPosition(node, component)

			setInterval(() => {
				// If component removed by user, then hide the instance
				if (component.parent === null) {
					// Keep getting error message when changing node visibility
					node.visible = false
				}

				// FIXME: positioning
				setPosition(node, component)
				if (
					figma.getNodeById(node.id) &&
					figma.getNodeById(component.id)
				) {
					component.resize(node.width, node.height)
					component.layoutAlign = nodeLayoutAlign
					component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
					component.counterAxisSizingMode = nodeCounterAxisSizingMode
				}
			}, 100)

			if (figma.getNodeById(node.id)) {
				node.opacity = 0
			}

			figma.on('close', () => {
				if (figma.getNodeById(node.id)) {
					node.opacity = nodeOpacity
					// Probably not needed now that they are applied when resized at set interval
					// component.layoutAlign = nodeLayoutAlign
					// component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
				}

				// Need to find component because user may have deleted/undone it
				const freshComponent = findComponentById(component.id)
				if (freshComponent && freshComponent?.parent !== null) {
					if (node.type !== 'COMPONENT') {
						freshComponent.remove()
					}
				}

				// FIXME: needs some work. Should loop through each node in original selection to see if they still exist
				if (figma.getNodeById(origSel[0].id)) {
					if (node.type !== 'COMPONENT') {
						figma.currentPage.selection = origSel
					}
				}
			})
		} else {
			if (node.children) {
				editSlot(node.children)
			}
		}
	}

	return nSlotsFound
}

console.clear()

export default function () {
	if (figma.command === 'makeSlot') {
		const sel = figma.currentPage.selection
		let numberSlotsMade = 0

		if (countSlots(sel) > 1) {
			figma.closePlugin(`Already contains ${numberSlots} slots`)
		} else if (numberSlots === 1) {
			figma.closePlugin(`Already contains ${numberSlots} slot`)
		} else {
			for (let i = 0; i < sel.length; i++) {
				const node = sel[i]

				// Cannot make when part of an instance and part of component
				const isAwkward = isPartOfInstance(node)

				if (getPluginData(node, 'isSlot') !== true) {
					if (!isAwkward && isPartOfComponent(node)) {
						const parentComponent = getComponentParent(node)

						if (parentComponent) {
							setPluginData(parentComponent, 'isSlotParent', true)
							parentComponent.setRelaunchData({
								editSlot: 'Edit slots on this instance',
								removeSlot: 'Remove slots on this instance',
							})
						}

						const { component } = makeComponent(node)

						component.name = component.name + ' <slot>'
						// newInstance.name = component.name + " <slot>"

						setPluginData(component, 'isSlot', true)

						if (parentComponent) {
							if (node.type !== 'INSTANCE') {
								component.remove()
							}
						}

						numberSlotsMade += 1
					} else {
						if (isAwkward) {
							figma.notify('Edit main component to make slot')
						} else {
							figma.notify('Slot must be inside a component')
						}
					}
				} else {
					figma.notify('Already a slot')
				}
			}

			if (numberSlotsMade > 1) {
				figma.currentPage.selection = newSel
				figma.notify(`${numberSlotsMade} slots made`)
			} else if (numberSlotsMade === 1) {
				figma.currentPage.selection = newSel
				figma.notify(`${numberSlotsMade} slot made`)
			}
		}

		figma.closePlugin()
	}

	if (figma.command === 'editSlot') {
		const sel = figma.currentPage.selection

		if (sel.length > 0) {
			const handle = figma.notify('Editing slots...', {
				button: {
					text: 'Done',
					action: () => {
						figma.closePlugin()
						return true
					},
				},
				timeout: 99999999999,
			})
			const nSlotsFound = editSlot(sel)

			if (nSlotsFound > 0) {
				figma.on('close', () => {
					handle.cancel()
				})
			}
			if (nSlotsFound === 0) {
				handle.cancel()
				figma.closePlugin('No slots found')
			}
		} else if (sel.length === 0) {
			figma.closePlugin('Please select a slot or instance with slots')
		}
	}

	if (figma.command === 'removeSlot') {
		const nSlotsRemoved = removeSlot(figma.currentPage.selection)

		// Check remaining slots and if none then remove relaunch data from parent component
		for (let i = 0; i < figma.currentPage.selection.length; i++) {
			const node = figma.currentPage.selection[i]
			const parent = getComponentParent(node) || getSlotParent(node)

			// Only way to remove from instance parent as well is to set data when relaunch data added in first place on component so that you know to remove it when its an instance
			if (parent) {
				const count = countSlots([parent])

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
		} else if (nSlotsRemoved === 1) {
			figma.closePlugin(`${nSlotsRemoved} slot removed`)
		} else {
			figma.closePlugin(`No slots found`)
		}

		figma.closePlugin()
	}
}
