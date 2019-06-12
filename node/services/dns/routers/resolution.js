/**
* 接受到一个解析请求
* @param.msg 数据buffer
* @param.info 请求来源信息
*/

module.exports = async function(swc, options){
	console.log(options);
	/**
	* 1、查询本地缓存
	* 2、应答
	* 或
	* 1、发起向上递归查询请求
	* 2、保存向上递归请求信息
	*/
}