/**
* 主入口
*/

module.exports = async function(swc, options){
	/**
	* 初始化udp
	*/
	swc = await swc.services.dns.initService(swc, {}); //
}