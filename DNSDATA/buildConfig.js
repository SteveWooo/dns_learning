const fs = require('fs');

async function buildAuthServer(options){
	var source = options.source;
	var authServers = [];
	for(var i=0;i<source.length;i++){
		var auth = {
			cidr : source[i].cidr,
			gateWay : source[i].gateWay,
			subNet : [] 
		}

		var sb = source[i].subNet;
		for(var s=0;s<sb.length;s++){
			if(sb[s].serverType == 'Authoritative') {
				auth.subNet.push(sb[s]);
			}
		}

		if(auth.subNet.length == 0){
			continue;
		}
		authServers.push(auth);
	}

	return authServers;
}

async function buildSubNets(options){
	var authServers = options.authServers;
	var subNets = [];

	for(var i=0;i<authServers.length;i++){
		var sn = {
			cidr : authServers[i].cidr,
			gateWay : authServers[i].gateWay,
			servers : [],
		}

		for(var n=0;n<authServers[i].subNet.length;n++){
			var data = authServers[i].subNet[n];
			console.log(data);
		}
	}
}

async function main(){
	var source = require('./data2.json');
	var authServers = await buildAuthServer({
		source : source
	})

	var subNet = await buildSubNets({
		authServers : authServers
	})
}

main().then().catch(e=>{
	console.log(e);
})