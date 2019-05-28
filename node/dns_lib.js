/**
* 创建头部信息
*/
function buildHeader(bits){
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

exports.buildPackage = function(options){
	var buf;
	buf = Buffer.alloc(1024);

	/**
	* 因为Buffer.write是要传一个字符串，然后他再转换成ascii码，然后再变成二进制码发出去
	* 所以这里要把他们先弄成一个一个bit，放进bits
	* bits中每个bit代表期望放进最终buffer中的每个bit 的ascii码。
	*/
	var bits = [];

	console.log(buf);

	bits = buildHeader(bits);

	console.log(buf);

	return buf;
}