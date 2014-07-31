module.exports = {
	name: 'windows',
	defaultOptions: {
		environment: 'dev',
		appid: 'com.test.app',
		skip_ir: true,
		certname: 'CN=Test',
		publisher: 'Test',
		phonepublisherid: '00000000-0000-0000-0000-000000000000',
		target: 'Windows' // 'Windows' or 'WindowsPhone'
	},
	dirname: __dirname
};