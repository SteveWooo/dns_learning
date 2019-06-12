module.exports = {
	/**
	* 新建一个请求时需要set一个新的id，并且设置回调信息。
	*/
	set : require(`${__dirname}/queryQueues/set`),

	/**
	* 得到响应时，要把id删除掉，并获取回调信息。
	*/
	get : require(`${__dirname}/queryQueues/get`),

	/**
	* 获取最新queryid
	*/
	setId : require(`${__dirname}/queryQueues/setId`),
}