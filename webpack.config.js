module.exports = {
	entry: {
		'inbox-zero': './inbox-zero.es6',
		'options': './options.es6',
		'background': './background.es6',
	},
	output: {
		path: __dirname + '/dist',
		filename: '[name].js',
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			},
		],
	},
};
