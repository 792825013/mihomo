const BASE_CONFIG = {
  mode: 'rule',
  dns: {
    enable: true,
    listen: '0.0.0.0:53',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': ['*.lan', '*.localdomain', '+.home.arpa'],
    'nameserver-policy': {
      'geosite:cn': ['https://223.5.5.5/dns-query', 'https://120.53.53.53/dns-query'],
      'geosite:geolocation-!cn': ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query']
    },
    'default-nameserver': ['223.5.5.5']
  },
  tun: {
    enable: true,
    stack: 'system',
    'dns-hijack': ['any:53']
  },
  rules: [
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,DIRECT',
    'MATCH,GLOBAL'
  ],
  'proxy-groups': [
    { name: 'GLOBAL', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300, tolerance: 50 }
  ]
};

function main(config) {
  const globalProxies = BASE_CONFIG['proxy-groups'][0].proxies;
  const sgRegex = /(新加坡|🇸🇬)/;

  config.proxies.forEach(({ name }) => {
    if (sgRegex.test(name)) globalProxies.push(name);
  });

  return { ...config, ...BASE_CONFIG };
}
