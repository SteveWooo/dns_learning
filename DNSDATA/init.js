const fs = require('fs');

/**
* meta elements :
* named.serverType : dns | rootUnion | recursion | forward | bussiness
* named.zone : cn com root root us ... (will use ${zone}.zone file)
* named.zoneFile : com.fake.zone or root.bancn.zone (only for special zone file..)
*       or : root.ca root.cnlocal.ca root.inlocal.ca root.uslocal.ca
* named.forwardIps : xx.xx.xx.xx;xx.xx.xx.xx; (only for forward servers)
* named.logging : query
*/
async function init(){
    var swc = {

    };
    var metaData = fs.readFileSync('/meta.js').toString();
    // var metaData = {
    //     'named.serverType' : 'dns',
    //     'named.zone' : 'cn',
    //     // 'named.zoneFile' : 'root.bancn.zone',
    //     // 'named.forwardIps' : '112.0.1.233;',
    //     'named.logging' : 'query'
    // }
    try {
        metaData = JSON.parse(metaData);
        swc.meta = {};
        for(var i in metaData){
            var t = i.split('.');
            if(t[0] == 'named'){
                swc.meta[t[1]] = metaData[i]; 
            }
        }
        if(swc.meta.serverType == undefined){
            return undefined;
        }
        return swc;
    }catch(e){
        console.log(e);
    }
}

const CONFIGS = {
    'dns' : {
        recursion : 'no'
    },
    'rootUnion' : {
        recursion : 'no'
    },
    'recursion' : {
        recursion : 'yes'
    },
    'forward' : {
        recursion : 'yes'
    },
}

async function getConfig(swc){
    var config = {
        options : {
            directory : '"/etc/named"',
            'pid-file' : '"named.pid"',
            recursion : ''
        },
        zones : []
    }
    var meta = swc.meta;

    if(!(meta.serverType in CONFIGS)){
        return undefined;
    }
    config.options['recursion'] = CONFIGS[meta.serverType].recursion;
    if(meta.forwardIps != undefined) {
        if(meta.forwardIps[meta.forwardIps.length - 1] != ';'){
            meta.forwardIps = meta.forwardIps + ';';
        }
        config.options['forwarders'] = '{' + meta.forwardIps + '}';
    }

    //master zone
    if(meta.serverType == 'dns'){
        var zone = {
            name : meta.zone,
            type : 'master',
            file : 'zone/' + (meta.zoneFile == undefined ? 
                ( meta.zone == '.' ? 'root' : meta.zone.replace(/\./g, '') )
             + '.zone' : meta.zoneFile)
        }

        if(zone.name == 'root'){
            zone.name = '.'
        }

        if(zone.name[zone.name.length - 1] != '.') {
            zone.name = zone.name + '.';
        }

        config.zones.push(zone);
    }

    //union zone
    if(meta.serverType == 'rootUnion'){
        var zone = {
            name : '.',
            type : 'master',
            file : '/etc/named/zone/topZone.zone'
        }
        config.zones.push(zone);
    }

    //ca zone
    if(meta.serverType == 'recursion') {
        var zone = {
            name : meta.zone == undefined ? '.' : meta.zone,
            type : 'hint',
            file : 'zone/' + (meta.zoneFile == undefined ? 'root.ca' : meta.zoneFile)
        }
        if(zone.name == 'root'){
            zone.name = '.';
        }
        config.zones.push(zone);
    }

    return config;
}

async function getNamedConf(swc, options){
    var config = options.config;
    var namedConf = ``;
    var optionsContent = '';
    for(var i in config.options) {
        optionsContent += '    ' + i + ' ' + config.options[i] + ';\n';
    }
    if(swc.meta.zone == '.' || swc.meta.zone == 'root') {
        optionsContent += '    #blackhole {112.0.1.233;};\n';
    }
    namedConf += 
`
options {
${optionsContent}
};

`;
    
    var zoneContent = '';
    for(var i=0;i<config.zones.length;i++){
        var z = config.zones[i];
        zoneContent += `
zone "${z.name}" IN {
    type ${z.type};
    file "${z.file}";
};

        `;
    }
    namedConf += zoneContent;

    var logContent = `
logging {
    channel query_log {
        file "/var/named/log/query.log" versions 3 size 20m;
        print-time yes;
        print-category yes;
        severity dynamic;
    };
    category queries {
        query_log;
    };
};
`;
    namedConf += logContent;

    return namedConf;
}

async function main(){
    try{
        var swc = await init();
        if(!swc){
            return ;
        }
        var config = await getConfig(swc);
        if(!config){
            console.log('init error');
            return ;
        }

        var namedConf = await getNamedConf(swc, {
            config : config
        })

        fs.writeFileSync('/etc/named.conf', namedConf);
    }catch(e){
        console.log(e);
    }
}

main();