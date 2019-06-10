const path = require('path');
async function main(){
	var config = {};
	var swc = await require(`${path.resolve()}/models/swc`)({
		config : config
	});
	console.log(swc);
}

try{
	main();
}catch(e){
	console.log(e);
}