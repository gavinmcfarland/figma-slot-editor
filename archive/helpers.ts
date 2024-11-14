function findTopInstance(node) {
	if (node.type === 'PAGE') return null
	if (isPartOfInstance(node)) {
		return findTopInstance(node.parent)
	} else {
		return node
	}
}
