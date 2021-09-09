<script lang="ts">
	import Field from './Field.svelte'
	import { onMount } from 'svelte'
	import './reset.css'

	export const name: string = ''
	let file
	let token
	let settingsStored = false

	let mobileLibrary =
		'https://www.figma.com/file/uJP2MQ5WJsACpnVIz8OE9O/HALO-MOBILE-COLOUR-PALETTE?node-id=0%3A1'

	let selectedLibrary

	async function getRestApi(file, token) {
		const fileId = file.match(/(?<=file\/)\w+(?=\/)/gi)[0]
		const res = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
			method: 'GET',
			headers: {
				'X-Figma-Token': token,
			},
		})
		const text = await res.text()

		return text
	}

	function submitRestApi(file, token) {
		getRestApi(file, token).then((response) => {
			parent.postMessage(
				{
					pluginMessage: {
						type: 'sync-changes',
						restApi: response,
						file: file,
						token: token,
					},
				},
				'*'
			)
			alert('Settings saved')
		})
	}

	function disconnectLibrary() {
		parent.postMessage(
			{
				pluginMessage: {
					type: 'disconnect-library',
				},
			},
			'*'
		)
	}

	onMount(() => {
		window.onmessage = (event) => {
			const message = event.data.pluginMessage

			// if (message.type === 'sync-changes') {
			file = message.file

			// if access token stored, don't show it
			if (message.token) {
				token = message.token
				settingsStored = true
			}
		}
	})
</script>

<main>
	{#if settingsStored}
		<ul class="List">
			<li>
				<a href="#" on:click={() => disconnectLibrary()}
					>Disconnect from library</a>
			</li>
			<li>
				<a
					href="#"
					on:click={() => submitRestApi(selectedLibrary, token)}
					>Sync changes</a>
			</li>
		</ul>
	{:else}
		<div class="Select">
			<label for="libraries">Library</label>
			<select
				name="libraries"
				id="libraries"
				bind:value={selectedLibrary}>
				<option value={mobileLibrary}>Mobile</option>
			</select>
		</div>

		<Field type="text" placeholder="Access Token" bind:value={token} />
		<p style="margin-bottom: var(--size-200)">
			<span /> Generate by going to
			<mark>Settings > Account > Personal access tokens</mark>
		</p>

		<div class="BottomBar">
			<button on:click={() => submitRestApi(selectedLibrary, token)}
				>Save</button>
		</div>
	{/if}
</main>

<style global>
	mark {
		background-color: var(--color-black-10);
		padding-left: 2px;
		padding-right: 2px;
	}

	main {
		padding: var(--size-200);
	}

	main > :not(:last-child) {
		margin-bottom: var(--size-100);
	}
	button {
		width: 100%;
		line-height: 28px;
		padding: var(--size-0) var(--size-200);
		border: 2px solid var(--color-blue);
		background-color: var(--color-blue);
		color: white;
		border-radius: var(--border-radius-75);
		font-weight: 500;
		letter-spacing: 0.055px;
	}

	.Select {
		display: flex;
		place-items: center;
	}

	.Select label {
		margin-right: var(--size-200);
	}

	.Select select {
		flex-grow: 1;
		border-radius: var(--border-radius-25);
		height: 28px;
		border-color: var(--color-black-10);
		border-width: 1px;
		padding-inline: calc(var(--size-100) - 1px);
		padding-right: calc(var(--size-300) - 1px);
		-webkit-appearance: none;
		background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
		background-repeat: no-repeat, repeat;
		/* arrow icon position (1em from the right, 50% vertical) , then gradient position*/
		background-position: right 0.7em top 50%, 0 0;
		/* icon size, then gradient */
		background-size: 0.65em auto, 100%;
	}

	.List {
		list-style: none;
		margin: 0;
		padding: 0;
		margin-top: var(--size-100);
	}

	.List li {
		margin: 0;
		padding: 0;
		margin-bottom: var(--size-200);
	}

	a {
		color: var(--color-blue);
		text-decoration: none;
		font-weight: bold;
	}
</style>
