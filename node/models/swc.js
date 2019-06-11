/**
* 初始化swc
* @param.config 配置项目，留空
*/
const path = require('path');
module.exports = async function(options){
	global.swc = {
		/**
		* 请求队列
		*/
		queryQueue : {
			/**
			* 请求id排队，每次使用就要进行一次+1的原子操作，上限是255*255，255进制2位。
			*/
			queryId : [0, 0],
		}
	};
	var swc = {
		config : options.config,
		/**
		* 工具块
		*/
		utils : {
			dns : {
				parse : require(`${__dirname}/../utils/dnsLibs/dnsParse.js`),
				sendLib : require(`${__dirname}/../utils/dnsLibs/dnsSend.js`),
			}
		},
		/**
		* 服务块
		*/
		services : {
			dns : {
				initService : require(`${__dirname}/../services/dns/initService.js`),
				/**
				* 负责接受处理所有udp包，配合queryQueue使用
				*/
				routers : require(`${__dirname}/../services/dns/router.js`),

				/**
				* 对请求进行识别匹配操作
				* 配合使用global
				*/
				queryQueue : require(`${__dirname}/../services/dns/queryQueue.js`)
			},
			/**
			* 通过initService进行初始化
			* 主要有以下几个操作：
			* 1、发包
			* 2、存取缓存
			*/
			dnsHandle : undefined,
		},
		dao : {
			dns : {
				resolutionCache : require(`${__dirname}/dao/dns/resolutionCache.js`),
			}
		}
	}

	swc = await require(`${__dirname}/../services/dns/initService.js`)(swc, {});

	return swc;
}