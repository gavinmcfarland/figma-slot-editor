<script>
	// import { valueStore } from "./data.js"
	import { onMount } from 'svelte'

	export let placeholder = 'PLACEHOLDER'
	export let value = ''
	export let label = ''
	export let disabled = false
	export let id = false
	export let type
	export let min = null
	export let max = null
	export let step = null
	export let classes = ''
	export let masked

	let input

	function maskToken(node) {
		if (masked) {
			node.classList.add('masked')
		}
	}

	onMount(() => {
		if (masked) {
			input.value = ''
		}
	})

	const handleInput = (e) => {
		// in here, you can switch on type and implement
		// whatever behaviour you need
		value = type.match(/^(number|range)$/)
			? +e.target.value
			: e.target.value

		// if (masked) {

		// }
		//   if (id === "columns") {
		// valueStore.update((data) => {
		// 	data[id] = value
		// 	return data
		// })

		//   }
	}
</script>

<div>
	<label class="TextField normal {classes}">
		{#if label}
			<span>{label}</span>
		{/if}
		<input
			bind:this={input}
			spellcheck={false}
			{id}
			{type}
			{placeholder}
			{disabled}
			{value}
			{min}
			{max}
			{step}
			on:change={handleInput} />
	</label>
</div>

<style>
	div {
		padding-block: 2px;
	}
	.masked {
		background-color: black;
	}
	.TextField {
		display: flex;
		border: 2px solid transparent;
		place-items: center;
		height: 28px;

		padding-inline: calc(var(--size-100) - 2px);
		border-radius: var(--border-radius-25);
	}

	.TextField.ghost:hover {
		border-color: var(--color-black-10);
		border-width: 1px;
		padding-inline: calc(var(--size-100) - 1px);
	}

	.TextField:focus-within {
		border-color: var(--color-blue);
		border-width: 2px;
		padding-inline: calc(var(--size-100) - 2px);
	}

	.TextField span {
		margin-right: var(--size-100);
		color: var(--color-black-30);
		flex-shrink: 0;
	}

	input::placeholder {
		color: var(--color-black-30);
	}

	.TextField input {
		flex-grow: 1;
		cursor: default;
		width: 100%;
	}

	.normal {
		border-color: var(--color-black-10);
		border-width: 1px;
		padding-inline: calc(var(--size-100) - 1px);
	}

	.ghost {
		margin-left: calc(
			var(--fgp-gap_item_column, 0px) + (-1 * var(--size-100))
		);
		margin-right: calc((-1 * var(--size-100)));
	}
</style>
