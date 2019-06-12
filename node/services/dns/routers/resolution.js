async function requestForword(swc, options){
	/**
	* 创建请求id
	*/
	var queryId = await swc.services.dns.queryQueue.setId(swc, options);
	var packageBuffer = await swc.utils.dns.sendLib.buildPackage(swc, {
		package : {
			header : {
				id : queryId,
			},
			question : {
				domain : options.package.question.domain
			}
		}
	})

	swc.dnsHandle.send(swc, {
		packageBuffer : packageBuffer,
		address : '114.114.114.114'
	})
}

/**
* 接受到一个解析请求
* @param.msg 数据buffer
* @param.info 请求来源信息
*/

module.exports = async function(swc, options){
	// console.log(options);
	/**
	* 1、查询本地缓存
	* 2、应答
	* 或
	* 1、发起向上递归查询请求
	* 2、保存向上递归请求信息
	*/

	await requestForword(swc, options);
}