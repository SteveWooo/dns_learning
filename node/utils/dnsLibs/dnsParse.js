function parseHeader(swc, options){
	var header = {};
	var flag_1 = options.msg[2];
	var flag_2 = options.msg[3];
	flag_1 = flag_1.toString(2);
	flag_2 = flag_2.toString(2);
	/**
	* 补0
	*/
	for(var i = flag_1.length; i < 8; i++){
		flag_1 = '0' + flag_1;
	}
	for(var i = flag_2.length; i < 8; i++){
		flag_2 = '0' + flag_2;
	}

	header.qr = flag_1[0];
	return header;
}

function parseQuestion(options, bits){

}

function parseType(options, bits){

}

/**
* 负责解析请求数据包
* @param.msg DNS请求数据包
*/
module.exports = async function(swc, options){
	var result = {};

	result.header = parseHeader(swc, options);

	return result;
}