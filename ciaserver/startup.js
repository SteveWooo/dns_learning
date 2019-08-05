const express = require('express');
const app = express();

function getClientIp(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    ip = ip.substr(ip.lastIndexOf(':')+1,ip.length);
    return ip;  
};

app.get('/', async function (req,res){
	var ip = getClientIp(req);
	console.log('request : ' + ip);
	res.send(
`
<html>
<head>
</head>
<body>
<script>
    location.href = "https://www.baidu.com"
</script>
</body>
</html>
`);
})

app.listen(80);