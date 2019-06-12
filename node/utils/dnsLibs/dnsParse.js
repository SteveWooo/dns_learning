function parseHeader(swc, options){
	var header = {};

	/**
	* id部分，按照我的格式 x-x
	*/
	header.id = options.msg[0] + "-" + options.msg[1];

	/**
	* flag部分
	*/
	var flag_1 = options.msg[2];
	var flag_2 = options.msg[3];
	flag_1 = flag_1.toString(2);
	flag_2 = flag_2.toString(2);
	//补0
	for(var i = flag_1.length; i < 8; i++){
		flag_1 = '0' + flag_1;
	}
	for(var i = flag_2.length; i < 8; i++){
		flag_2 = '0' + flag_2;
	}

	header.qr = flag_1[0];
	header.opcode = flag_1[1] + flag_1[2] + flag_1[3] + flag_1[4];
	header.aa = flag_1[5];
	header.tc = flag_1[6];
	header.rd = flag_1[7];
	header.ra = flag_2[0];
	header.rcode = flag_2[4] + flag_2[5] + flag_2[6] + flag_2[7];

	/**
	* 各种数目
	*/
	header.questionCount = options.msg[4]*16 + options.msg[5];
	header.answerCount = options.msg[6] * 16 + options.msg[7];
	header.authorityCount = options.msg[8] * 16 + options.msg[9];
	header.additionalCount = options.msg[10] * 16 + options.msg[11];

	return header;
}

function parseQuestion(swc, options){
	var question = {
		domain : "",
		type : "",
		class : "",
	}

	for(var i = 12;options.msg[i] !== 0;i += options.msg[i] + 1){
		for(var w = 1;w <= options.msg[i];w ++){
			var char = String.fromCharCode(options.msg[i + w]);
			question.domain += char;
		}
		if(options.msg[i + options.msg[i] + 1] !== 0){
			question.domain += '.';
		}
	}

	var typeBegin = 12 + question.domain.length + 2;
	question.type = options.msg[typeBegin] * 16 + options.msg[typeBegin + 1];
	question.class = options.msg[typeBegin + 2] * 16 + options.msg[typeBegin + 3];

	return question;
}

/**
* 负责解析请求数据包
* @param.msg DNS请求数据包
*/
module.exports = async function(swc, options){
	var result = {};

	result.header = parseHeader(swc, options);
	result.question = parseQuestion(swc, options);

	return result;
}