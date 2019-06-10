/**
* 创建头部信息
*/
function buildHeader(options, bits){
	/**
	* 1、创建序列id(2bit)
	*/
	bits.push(0);
	bits.push(1);

	/**
	* 2、创建tag(2bit)
	* 这里转换很恶心,要弄成：|0 0000 0 0 1|0 000 0000|，因此，这两个bit的ascii码就是（1，0）
	*/
	bits.push(1);
	bits.push(0);

	/**
	* 3、询问数目
	* 查一个域名，所以丢一个1进去
	*/
	bits.push(0);
	bits.push(1);

	/**
	* 4:应答数目
	* 5:授权数目
	* 6:附加数目
	* 这几个全是0，所以丢6个bit的0进去
	*/
	bits.push(0);
	bits.push(0);

	bits.push(0);
	bits.push(0);
	
	bits.push(0);
	bits.push(0);
	return bits;
}

/**
* 塞域名进去
*/
function buildQuestion(options, bits){
	var domain = options.domain;

	domain = domain.split('.');
	for(var i=0;i<domain.length;i++){
		bits.push(domain[i].length); //长度计数丢进去咯

		/**
		* 然后把每个字符串转换成ascii码再丢进去
		*/
		for(var k=0;k<domain[i].length;k++){
			bits.push(domain[i][k].charCodeAt());
		}
	}
	//别忘了加个0结束；
	bits.push(0);

	return bits;
}

/**
* 塞类型进去（两个1）
*/
function buildType(options, bits){
	/**
	* type 1代表A解析
	*/
	bits.push(0);
	bits.push(1);

	/**
	* classes
	*/
	bits.push(0);
	bits.push(1);

	return bits;
}

/**
* 把bits转换成ascii字符，一个一个传到buf中去
*/
function convertBitsToBuffer(options, bits){
	var buf = Buffer.alloc(bits.length);
	for(var i=0;i<bits.length;i++){
		var char = String.fromCharCode(bits[i]);
		buf.write(char, i); //或者用concat(buf1, buf2)合起来新的buf；
	}
	return buf;
}

exports.buildPackage = async function(options){
	/**
	* 因为Buffer.write是要传一个字符串，然后他再转换成ascii码，然后再变成二进制码发出去
	* 所以这里要把他们先弄成一个一个bit，放进bits
	* bits中每个bit代表期望放进最终buffer中的每个bit 的ascii码。
	* 例如你想弄一位 | 0000 1000 | 进去buffer中，那么就 bits.push(8);
	*/
	var bits = [];
	bits = buildHeader(options, bits);
	bits = buildQuestion(options, bits);
	bits = buildType(options, bits);

	var buf = convertBitsToBuffer(options, bits);

	return buf;
}