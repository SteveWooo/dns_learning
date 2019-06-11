module.exports = {
	/**
	* 接收到响应包
	*/
	receive : require(`${__dirname}/routers/receive`),

	/**
	* 接收到端的请求
	*/
	resolution : require(`${__dirname}/routers/resolution`)
}