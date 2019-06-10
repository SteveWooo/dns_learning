/**
* 初始化swc
* @param.config 配置项目，留空
*/
const path = require('path');
module.exports = async function(options){
	var swc = {
		config : options.config,
		/**
		* 工具块
		*/
		utils : {
			dns : {
				receiveLib : require(`${__dirname}/../utils/dnsLibs/dnsReceive.js`),
				sendLib : require(`${__dirname}/../utils/dnsLibs/dnsSend.js`),
			}
		},
		/**
		* 服务块
		*/
		service : {
			dns : {
				initService : require(`${__dirname}/../services/dns/initService.js`),
				resolution : require(`${__dirname}/../services/dns/resolution.js`),
			},
			dnsHandle : undefined, //需要被上面的initService进行初始化处理
		},
		dao : {
			dns : {
				resolutionCache : require(`${__dirname}/dao/dns/resolutionCache.js`),
			}
		}
	}

	return swc;
}