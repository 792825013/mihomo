const BASE_CONFIG = {
  mode: 'rule',
  dns: {
    enable: true,
    listen: '0.0.0.0:53',
    'enhanced-mode': 'fake-ip',
    'nameserver-policy': {
      'geosite:cn': ['https://223.5.5.5/dns-query', 'https://doh.pub/dns-query'],
      'geosite:geolocation-!cn': ['https://1.1.1.1/dns-query', 'https://dns.google/dns-query']
    }
  },
  rules: ['GEOIP,private,DIRECT,no-resolve', 'GEOSITE,cn,DIRECT', 'GEOIP,cn,DIRECT,no-resolve', 'MATCH,GLOBAL'],
  'proxy-groups': [
    { name: 'GLOBAL', type: 'select', proxies: ['SG新加坡', 'JP日本'] },
    { name: 'SG新加坡', type: 'url-test', proxies: [] },
    { name: 'JP日本', type: 'url-test', proxies: [] }
  ]
};

function main(config) {
  const sgProxies = BASE_CONFIG['proxy-groups'][1].proxies;
  const jpProxies = BASE_CONFIG['proxy-groups'][2].proxies;

  config.proxies.forEach(({ name }) => {
    if (name.includes('新加坡') || name.includes('🇸🇬')) sgProxies.push(name);
    else if (name.includes('日本') || name.includes('🇯🇵')) jpProxies.push(name);
  });

  return { ...config, ...BASE_CONFIG };
}
