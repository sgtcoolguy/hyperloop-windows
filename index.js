module.exports = {
	name: 'windows',
	defaultOptions: {
		environment: 'dev',
		appid: 'com.test.app',
		skip_ir: true,
		certname: 'CN=Test',
		publisher: 'Test',
		target: 'Windows' // 'Windows' or 'WindowsPhone'
	},
	dirname: __dirname
};