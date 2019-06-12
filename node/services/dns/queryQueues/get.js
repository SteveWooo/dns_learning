/**
* 根据响应包中的id，获取信息，并删除信息
* @param.queryId
*/
module.exports = async function(swc, options){
	var result = {};
	for(var i in global.swc.queryQueue.cache[options.queryId]){
		result[i] = global.swc.queryQueue.cache[options.queryId][i];
	}
	delete global.swc.queryQueue.cache[options.queryId];
	return result;
}