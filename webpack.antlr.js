const path = require('path');
const fs = require('fs');
const process = require('process');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const CATEGORIES = ['game', 'high', 'low', 'meta', 'ops', 'query', 'web', 'special'];

module.exports = ((env = {}) =>
{
	const targetCategory = env.category;

	if(targetCategory && targetCategory !== 'all' && CATEGORIES.includes(targetCategory))
	{
		return createConfig(targetCategory);
	}

	// Default: Return an array of all configurations so a single 'npx webpack' builds everything
	return CATEGORIES.map(catName => createConfig(catName));
});


function createConfig(name)
{

	const newConfig = {
		mode: 'production',
		entry: `./components/rosetta/languages-${name}.js`,
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: `languages-${name}.bundle.js`,
			library: {
				name: 'AntlrLanguages',
				type: 'assign-properties'
			},
			globalObject: 'self'
		},
		stats: {
			errorDetails: true
		},
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						keep_classnames: true, // Stops Terser from renaming CPP14Lexer to 'R'
						keep_fnames: true
					}
				})
			]
		},
		resolve: {
			extensions: ['.ts', '.js'],
			modules: [path.resolve(__dirname, '../../node_modules'), 'node_modules'],
			fallback: {
				"fs": false
			},
			alias: {
				// Redirects all standard 'antlr4' imports to your singleton wrapper
				'antlr4$': path.resolve(__dirname, 'components/rosetta/languages-antlr.js'),

				// Allows the wrapper to import the actual node_modules package safely
				'antlr4-core': path.resolve(__dirname, 'node_modules/antlr4')
			},
			plugins: [
				{
					apply(resolver)
					{
						const targetHook = resolver.ensureHook('resolve');

						resolver.getHook('described-resolve').tapAsync('AntlrBaseResolverPlugin', (request, resolveContext, callback) =>
						{
							const importPath = request.request;
							if(!importPath) return callback();

							// ROUTE A: Move relative local *Base.js requests down into the /JavaScript directory
							if(importPath.startsWith('.') && importPath.endsWith('Base.js'))
							{
								const fileName = path.basename(importPath);
								const absoluteFileDestination = path.resolve(request.path, 'JavaScript', fileName);

								const updatedRequest = Object.assign({}, request, {
									request: absoluteFileDestination
								});
								return resolver.doResolve(targetHook, updatedRequest, `Redirected Base down to JavaScript`, resolveContext, callback);
							}

							// ROUTE B: Bounce requests for core Lexer/Parser files made from INSIDE /JavaScript back UP one folder
							if(importPath.startsWith('.') &&
								request.path.endsWith('JavaScript') &&
								(importPath.includes('Lexer') || importPath.includes('Parser')) &&
								!importPath.endsWith('Base.js'))
							{

								const fileName = path.basename(importPath);
								const absoluteParentDestination = path.resolve(request.path, '..', fileName);

								const updatedRequest = Object.assign({}, request, {
									request: absoluteParentDestination
								});
								return resolver.doResolve(targetHook, updatedRequest, `Bounced token layer up to main lang directory`, resolveContext, callback);
							}

							return callback();
						});
					}
				},
				// {
				// 	apply: (compiler) =>
				// 	{
				// 		// 'afterDone' triggers ONLY after the entire build is finished and written to disk
				// 		compiler.hooks.afterDone.tap('CopyToDocsPlugin', () =>
				// 		{
				// 			try
				// 			{
				// 				// Deep copy the fresh dist folder to docs
				// 				fs.copyFileSync(path.resolve(__dirname, `dist/languages-${name}.bundle.js`), path.resolve(__dirname, `components/rosetta/languages-${name}.bundle.js`));
				// 				console.log('\n🚀 Success: Dynamically mirrored "dist" into "docs" folder.');
				// 			} catch(err)
				// 			{
				// 				console.error('\n❌ Failed to copy assets to docs directory:', err);
				// 			}
				// 		});
				// 	},
				// },
			]
		},
		module: {
			rules: [
				{
					test: /\.(ts|js)$/,
					exclude: /node_modules|Resources\/Parsers/,
					use: {
						loader: 'babel-loader',
						options: {
							babelrc: false,
							configFile: false,
							presets: [
								['@babel/preset-env', {
									modules: 'commonjs',
									targets: { browsers: "last 2 versions" }
								}]
							]
						}
					}
				}
			]
		}
	};

	webpack(newConfig, (err, stats) =>
	{
		if(err)
		{
			console.error(err);
			return;
		}

		console.log(stats.toString({ colors: true }));

		// Run your copy logic safely here in Node.js AFTER the build completes,
		// completely bypassing MultiCompiler hook failures.
		try
		{
			if(Array.isArray(newConfig))
			{
				// If it built multiple, copy all of them or whichever you need
				console.log('\n🚀 Success: All bundles compiled.');
			} else
			{
				// Single build copy
				fs.copyFileSync(
					path.resolve(__dirname, `dist/${newConfig.output.filename}`),
					path.resolve(__dirname, `components/rosetta/${newConfig.output.filename}`)
				);
				console.log('\n🚀 Success: Dynamically mirrored "dist" into "docs" folder.');
			}
		} catch(copyErr)
		{
			console.error('\n❌ Failed to copy assets:', copyErr);
		}
	});

	console.log(newConfig);
	return newConfig;
}
