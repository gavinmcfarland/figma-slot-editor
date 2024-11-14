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

async function findComponentById(id) {
	const node = await figma.getNodeByIdAsync(id)

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

const getTopLevelParent = (node: SceneNode | BaseNode): SceneNode => {
	if (node && node.parent && !isPageNode(node.parent)) {
		return getTopLevelParent(node.parent)
	} else if (node.type !== 'PAGE' && 'x' in node && 'y' in node) {
		// Ensure node has `x` and `y` properties, making it safe to return as a `SceneNode`
		return node as SceneNode
	} else {
		throw new Error('The top-level parent is not a SceneNode')
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

async function setPosition(node, component) {
	if (
		(await figma.getNodeByIdAsync(node.id)) &&
		(await figma.getNodeByIdAsync(component.id))
	) {
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

	return countNumberSlots
}

async function removeSlot(node, traverseChildren = true) {
	const nodes = putValuesIntoArray(node)

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]

		if (getPluginData(node, 'isSlot')) {
			numberSlots += 1
			traverseChildren = false
		}

		// TODO: Better if it removes from main component DONE

		if (node.type === 'INSTANCE') {
			let newName
			const mainComponent = await node.getMainComponentAsync()
			newName = mainComponent.name.replace(/<slot>$/, '')
			newName = newName.trim()
			if (newName !== mainComponent.name) {
				mainComponent.name = newName
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
				await removeSlot(node.children)
			}
		}

		if (node.id !== parentComponent?.id) {
			node.setRelaunchData({})
		}
	}

	return numberSlots
}

async function editSlot(node) {
	const nodes = putValuesIntoArray(node)

	for (let i = 0; i < nodes.length; i++) {
		const currentNode = nodes[i]

		if (
			getPluginData(currentNode, 'isSlot') &&
			currentNode.type === 'INSTANCE'
		) {
			nSlotsFound += 1

			// Store the node properties
			const nodeOpacity = currentNode.opacity
			const nodeLayoutAlign = currentNode.layoutAlign
			const nodePrimaryAxisSizingMode = currentNode.primaryAxisSizingMode
			const nodeCounterAxisSizingMode = currentNode.counterAxisSizingMode
			const origNodeVisible = currentNode.visible

			// Create the component
			const { component } = makeComponent(currentNode, 'edit')
			component.visible = origNodeVisible

			// Ensure selection is set only once
			if (!selectionSet) {
				figma.currentPage.selection = []
				selectionSet = true
			}

			// Check if component exists and append
			const componentNode = await figma.getNodeByIdAsync(component.id)
			if (componentNode) {
				figma.currentPage.appendChild(component)
			}

			setPosition(currentNode, component)

			// Periodically update component properties
			setInterval(async () => {
				if (component.parent === null) {
					currentNode.visible = false
				}

				setPosition(currentNode, component)

				const currentNodeRef = await figma.getNodeByIdAsync(
					currentNode.id,
				)
				const componentRef = await figma.getNodeByIdAsync(component.id)

				if (currentNodeRef && componentRef) {
					component.resize(currentNode.width, currentNode.height)
					component.layoutAlign = nodeLayoutAlign
					component.primaryAxisSizingMode = nodePrimaryAxisSizingMode
					component.counterAxisSizingMode = nodeCounterAxisSizingMode
				}
			}, 100)

			// Prepare nodes for the close event
			const originalNode = await figma.getNodeByIdAsync(currentNode.id)
			const freshComponent = await findComponentById(component.id)

			// Resolve all original selection nodes
			const originalSelectionNodes = await Promise.all(
				origSel.map((sel) => figma.getNodeByIdAsync(sel.id)),
			)

			// Set up the close event handler
			figma.on('close', () => {
				// Restore node opacity if it exists
				if (originalNode && 'opacity' in originalNode) {
					originalNode.opacity = nodeOpacity
				}

				// Remove the component if it exists and is not a component type
				if (
					freshComponent &&
					freshComponent.parent !== null &&
					currentNode.type !== 'COMPONENT'
				) {
					try {
						freshComponent.remove()
					} catch (error) {
						console.error('Failed to remove component:', error)
					}
				}

				// Restore original selection if nodes are still valid
				const validSelection = originalSelectionNodes.filter(
					(node): node is SceneNode => node && node.type !== 'PAGE',
				)
				if (validSelection.length) {
					figma.currentPage.selection = validSelection
				}
			})
		} else {
			if (currentNode.children) {
				await editSlot(currentNode.children)
			}
		}
	}

	return nSlotsFound
}

console.clear()

export default async function () {
	if (figma.command === 'makeSlot') {
		const sel = figma.currentPage.selection
		const numberCurrentSlots = countSlots(sel)
		let numberSlotsMade = 0

		for (let i = 0; i < sel.length; i++) {
			const node = sel[i]
			if (!isPartOfComponent(node)) {
				figma.notify('Slot must be inside a component')
			} else if (numberCurrentSlots > 1) {
				figma.closePlugin(
					`Already contains ${numberCurrentSlots} slots`,
				)
			} else if (numberCurrentSlots === 1) {
				figma.closePlugin(`Already contains ${numberCurrentSlots} slot`)
			} else {
				// Cannot make when part of an instance and part of component
				if (getPluginData(node, 'isSlot') !== true) {
					if (!isPartOfInstance(node) && isPartOfComponent(node)) {
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
						if (isPartOfInstance(node)) {
							figma.notify('Edit main component to make slot')
						} else {
							figma.notify('Slot must be inside a component')
						}
					}
				} else {
					figma.notify('Already a slot')
				}
			}
		}

		if (numberSlotsMade > 1) {
			figma.currentPage.selection = newSel
			figma.notify(`${numberSlotsMade} slots made`)
		} else if (numberSlotsMade === 1) {
			figma.currentPage.selection = newSel
			figma.notify(`${numberSlotsMade} slot made`)
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
			const nSlotsFound = await editSlot(sel)

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
		const nSlotsRemoved = await removeSlot(figma.currentPage.selection)

		// Check remaining slots and if none then remove relaunch data from parent component
		for (let i = 0; i < figma.currentPage.selection.length; i++) {
			const node = figma.currentPage.selection[i]
			const parent = getComponentParent(node) || getSlotParent(node)

			// Only way to remove from instance parent as well is to set data when relaunch data added in first place on component so that you know to remove it when its an instance
			if (parent) {
				const count = countSlots([parent])

				if (count < 1) {
					parent.setRelaunchData({})
				}
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
