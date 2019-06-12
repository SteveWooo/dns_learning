/**
* 接收到一个响应包
* 得到一个请求id，对照本地请求表，把信息返回给递归请求方即可
*/

module.exports = async function(swc, options){
	console.log(options);
	console.log(options.package.answer)
}