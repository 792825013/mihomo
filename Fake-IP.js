const BASE_CONFIG={
mode:'rule',
dns:{enable:true,listen:'0.0.0.0:53','enhanced-mode':'fake-ip','nameserver-policy':{'geosite:cn':['https://223.5.5.5/dns-query','https://doh.pub/dns-query'],'geosite:geolocation-!cn':['https://1.1.1.1/dns-query','https://dns.google/dns-query']}},
rules:['GEOIP,private,DIRECT,no-resolve','GEOSITE,cn,DIRECT','GEOIP,cn,DIRECT,no-resolve','MATCH,GLOBAL'],
'proxy-groups':[{name:'GLOBAL',type:'select',proxies:['SG新加坡','JP日本','其他节点']},{name:'SG新加坡',type:'url-test',proxies:[]},{name:'JP日本',type:'url-test',proxies:[]},{name:'其他节点',type:'select',proxies:[]}]
};

function main(config){
const p=config.proxies,g=BASE_CONFIG['proxy-groups'],gl=g.length,i=0;
while(i<p.length){
const n=p[i++].name.toLowerCase(),t=n.includes('新加坡')?g[1].proxies:n.includes('日本')?g[2].proxies:g[3].proxies;t[t.length]=n.toLowerCase();
}
Object.assign(config,BASE_CONFIG);
return config;
}
