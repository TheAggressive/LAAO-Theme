module.exports = {
	plugins: {
		'postcss-import': {},
		'postcss-for': {},

		// Previously reached the build as 'tailwindcss/nesting', a thin wrapper
		// Tailwind provided around this same plugin. With Tailwind gone the
		// wrapper goes too, so postcss-nesting is listed directly — without it
		// every nested rule in src/styles would be emitted verbatim and ignored
		// by browsers.
		'postcss-nesting': {},

		// preset-env's own nesting-rules stays enabled, matching the pipeline
		// before Tailwind was removed. Disabling it here dropped :hover rules
		// and flattened media-query-nested declarations into their parent.
		'postcss-preset-env': {
			stage: 2,
		},
		cssnano: process.env.NODE_ENV === 'production' ? {} : false,
	},
};
