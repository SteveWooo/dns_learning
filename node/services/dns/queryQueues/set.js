/**
* 建一个新的请求id，并保存请求信息在全局
* @param.source.package 递归请求源的请求包信息
* @param.source.info 递归请求源的信息
* @param.request.package 往外发出请求的包信息
* @param.request.info 往外发出请求的信息
* @param.queryId 请求id。
* 
* receive中把request的响应包整合在一起后，source需要的信息都收齐了，就可以响应回去给source了
*/
module.exports = async function(swc, options){
	global.swc.queryQueue.cache[options.queryId] = options;
}