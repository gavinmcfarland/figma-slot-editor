import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
// import svg from 'rollup-plugin-svg';
import typescript from 'rollup-plugin-typescript';
import { globalStyle } from 'svelte-preprocess';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import sveltePreprocess from 'svelte-preprocess';

/* Post CSS */
import postcss from 'rollup-plugin-postcss';
// import cssnano from 'cssnano';
// import { stylup } from './stylup'

// const processStylup = {
// 	markup({ content, filename }) {
// 		// phtml trips over sveltes markup attribute={handlerbars}. So this replaces those occurances with attribute="{handlebars}"
// 		content = content.replace(/(?<=\<[^>]*)=(\{[^{}]*\})/gmi, (match, p1) => {
// 			return `="${p1}"`
// 		})
// 		return stylup.process(content, { from: filename }).then(result => ({ code: result.html, map: null }));
// 	}
// }

/* Inline to single html */
import htmlBundle from 'rollup-plugin-html-bundle';

const production = !process.env.ROLLUP_WATCH;

export default [{
	input: 'src/main.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		// css({ output: 'bundle.css' }),
		// css(),
		postcss(),
		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production,
			tsconfig: "./src/tsconfig.json"
		}),
		htmlBundle({
			template: 'src/template.html',
			target: 'public/index.html',
			inline: true
		}),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
},
{
	input: 'figma/code.ts',
	output: {
		file: 'public/code.js',
		format: 'cjs',
		name: 'code'
	},
	plugins: [
		typescript(),

		// Needed for plugma
		nodePolyfills(),
		nodeResolve(),
		replace({
			'process.env.PKG_PATH': JSON.stringify(process.cwd() + '/package.json'),
			'process.env.VERSIONS_PATH': JSON.stringify(process.cwd() + '/.plugma/versions.json')
		}),
		json(),


		commonjs(),
		production && terser()
	]
}];

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
