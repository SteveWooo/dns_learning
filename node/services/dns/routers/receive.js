/**
* 递归完成的操作
* 直接把请求缓存删除掉，
*/
async function callback(swc, options){
	//1、根据应答包queryId，获取缓存请求
	var id = options.msg[0] + "-" + options.msg[1];
	var data = await swc.services.dns.queryQueue.get(swc, {
		queryId : id
	})

	//2、构建应答包buffer，要把id变会source的id那样子
	options.package.header.id = data.source.package.header.id;
	data.source.packageBuffer = await swc.utils.dns.sendLib.buildPackage(swc, options);

	//3、应答缓存请求
	await swc.services.dnsHandle.sendCallback(swc, data);
}

/**
* 接收到一个响应包
* 得到一个请求id，对照本地请求表，把信息返回给递归请求方即可
*/

module.exports = async function(swc, options){
	// console.log(options);
	// console.log(options.package.answer);

	/**
	* 判断一个条件，把这个包返回给请求段
	*/
	//todo if，这里直接向上请求一个递归服务器，包原路解析返回了
	await callback(swc, options);

	/**
	* 判断一个非条件，把包继续往上递归
	*/
	//todo else
}