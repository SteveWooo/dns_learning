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

async function findTldSubzone(options){
	// 获取tld name
	var tldName = options.zoneName.split('.')[0];
	var authServers = options.authServers;
	var subZones = [];
	for(var i=0;i<authServers.length;i++){
		var subNet = authServers[i].subNet;
		for(var s = 0;s<subNet.length;s ++){
			var zone = subNet[s].zone;
			
			for(var z=0;z<zone.length;z++){
				var name = zone[z].zoneName;
				name = name.substring(0, name.lastIndexOf('.'));
				var temp = name.split('.');

				if(temp.length != 2){
					continue;
				}

				if(temp[temp.length - 1] == tldName){
					subZones.push({
						zoneName : temp.join('.'),
						ip : authServers[i].subNet[s].ip
					})
				} 
			}
		}
	}
	return subZones;
}

async function findRootSubZone(options){
	var authServers = options.authServers;
	var subZones = [];

	for(var i=0;i<authServers.length;i++){
		var subNet = authServers[i].subNet;
		for(var s = 0;s<subNet.length;s ++){
			var zone = subNet[s].zone;
			
			for(var z=0;z<zone.length;z++){
				var name = zone[z].zoneName;
				if(name == 'root'){
					continue;
				}
				name = name.substring(0, name.lastIndexOf('.'));
				var temp = name.split('.');

				if(temp.length != 1){
					continue;
				}

				subZones.push({
					zoneName : temp.join('.'),
					ip : authServers[i].subNet[s].ip
				})
			}
		}
	}
	return subZones;
}

async function buildZoneFile(options){
	var zone = options.zone;
	var zoneFile;
	var zoneName;
	if(zone.zoneName == 'root'){
		zoneFile = 
`
.			86400	IN	SOA	a.root-servers.net.	mail	2019061702 1800 900 604800 86400
.			86400	IN	NS	a.root-servers.net.
a.root-servers.net.	518400	IN	A	192.58.128.30
`
		var subZones = await findRootSubZone({
			authServers : options.authServers
		})

		for(var i=0;i<subZones.length;i++){
			zoneFile += 
`
${subZones[i].zoneName}.	86400	IN	NS	ns.${subZones[i].zoneName}.
ns.${subZones[i].zoneName}.	518400	IN	A	${subZones[i].ip}
`
		}

		return zoneFile;
	}

	if(zone.zoneName.split('.').length == 2){
		zoneName = zone.zoneName.substring(0, zone.zoneName.indexOf('.'));
		zoneFile = 
`
${zoneName}.	86400	IN	SOA	ns.${zoneName}.	mail	2019061702 1800 900 604800 86400
${zoneName}.	86400	IN	NS	ns.${zoneName}.
ns.${zoneName}.	518400	IN	A	${options.server.ip}
`
		var subZones = await findTldSubzone({
			zoneName : zoneName,
			authServers : options.authServers
		})

		for(var i=0;i<subZones.length;i++){
			zoneFile += 
`
${subZones[i].zoneName}.	86400	IN	NS	ns.${subZones[i].zoneName}.
ns.${subZones[i].zoneName}.	518400	IN	A	${subZones[i].ip}
`
		}
		// console.log(zoneFile)
		return zoneFile
	}

	zoneName = zone.zoneName.substring(0, zone.zoneName.lastIndexOf('.'));
	if(zoneName.split('.').length == 2){
		zoneFile = 
`
${zoneName}.	86400	IN	SOA	ns.${zoneName}.	mail	2019061702 1800 900 604800 86400
${zoneName}.	86400	IN	NS	ns.${zoneName}.
ns.${zoneName}.	518400	IN	A	${options.server.ip}
`
		if(zone.subZone != undefined){
			for(var i=0;i<zone.subZone.length;i++){
				zoneFile += 
`
${zone.subZone[i].zoneName == '@' ? zoneName : zone.subZone[i].zoneName}.	518400	IN	A	${zone.subZone[i].ip}
`
			}
		}
		return zoneFile;
	}
	// console.log(zoneFile)
	return zoneFile;
}

async function buildAuthZoneFile(options){
	var authServers = options.authServers;
	for(var i=0;i<authServers.length;i++){
		for(var s = 0;s<authServers[i].subNet.length;s++) {
			
			//子zoneFile收集
			for(z=0;z<authServers[i].subNet[s].zone.length;z++){
				var zone = authServers[i].subNet[s].zone[z];
				var zoneFile = await buildZoneFile({
					zone : zone,
					server : authServers[i].subNet[s],
					authServers : authServers
				})
				zone.zoneFile = zoneFile;

			}
		}
	}
	return authServers;
}

async function writeZoneFiles(options){
	var authServers = options.authServers;
	// fs.mkdirSync('./zoneFiles/auth');
	// fs.mkdirSync('./zoneFiles/tlds');

	var config = [];

	for(var i=0;i<authServers.length;i++){
		//子网：
		var sn = {
			cidr : authServers[i].cidr,
			gateWay : authServers[i].gateWay,
			servers : []
		}
		for(var s = 0;s<authServers[i].subNet.length;s++) {
			// dns服务器
			var server = {
				ip : authServers[i].subNet[s].ip,
				serverType : 'authoritative',
				zones : ''
			}

			var serverHandleZones = [];

			//子zoneFile收集
			for(z=0;z<authServers[i].subNet[s].zone.length;z++){
				var zone = authServers[i].subNet[s].zone[z];
				if(zone.zoneFile!=undefined){

					var temp = zone.zoneName.split('.');
					//root
					if(temp.length == 1){
						fs.writeFileSync(`./zoneFiles/${temp[0]}.zone`, zone.zoneFile);
						serverHandleZones.push(temp[0]);
					}
					//tlds
					if(temp.length == 2){
						fs.writeFileSync(`./zoneFiles/tlds/${temp[0]}.zone`, zone.zoneFile);
						serverHandleZones.push(temp[0]);
					}

					if(temp.length == 3){
						fs.writeFileSync(`./zoneFiles/auth/${[temp[0],temp[1]].join('.')}.zone`, zone.zoneFile);
						serverHandleZones.push([temp[0],temp[1]].join('.'));
					}
				}
			}

			server.zones = serverHandleZones.join(',');

			sn.servers.push(server);
		}

		config.push(sn);
		console.log(`done : ${i}/${authServers.length}`)
	}

	fs.writeFileSync('./zoneFiles/config.json', JSON.stringify(config));
}

async function main(){
	var source = require('./data2.json');
	var authServers = await buildAuthServer({
		source : source
	})

	authServers = await buildAuthZoneFile({
		authServers : authServers
	})

	// fs.writeFileSync('./authZoneFiles.json', JSON.stringify(authServers));
	await writeZoneFiles({
		authServers : authServers
	})
}

main().then().catch(e=>{
	console.log(e);
})        