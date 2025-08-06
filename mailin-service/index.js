var mailin = require('mailin')

var options = {
	port: 1025,
	webhook: process.env.PB_HOST + '/api/mc/webhook/mailin'
}

mailin.start(options)

mailin.on('message', function (connection, data, content) {
	// do something with email
})
