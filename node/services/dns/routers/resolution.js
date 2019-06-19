async function requestForword(swc, options){
	//0、创建请求id
	var queryId = await swc.services.dns.queryQueue.setId(swc, options);

	//1、添加一个请求包信息在这里
	options.request = {
		package : options.package,
		packageBuffer : undefined,
		address : '114.114.114.114',
		// address : '198.41.0.4', //根服务器
		// address : '199.7.91.13'
	}

	//2、写id到请求包里面
	if(!options.request.package.header){
		options.request.package.header = {
			id : queryId
		}
	} else {
		options.request.package.header.id = queryId;
	}

	//3、构建请求包buffer
	options.request.packageBuffer = await swc.utils.dns.sendLib.buildPackage(swc, options);

	//4、添加一个源包信息在这里
	options.source = {
		info : options.info,
		/**
		* 防止和上方请求包指针共用，这里还是重新parse一次比较妥当
		*/
		package : await swc.utils.dns.parse(swc, {
			msg : options.msg,
			info : options.info
		})
	}
	
	//5、进入发送包流程
	swc.services.dnsHandle.send(swc, options);
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