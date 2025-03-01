const BASE_CONFIG = {
  mode: 'rule',
  'mixed-port': 7890,
  dns: {
    enable: true,
    listen: '0.0.0.0:53',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': ['*.lan', '*.localdomain', '+.home.arpa'],
    'dns-cache': true,
    'dns-cache-ttl': 3600, // 缓存 1 小时
    'nameserver-policy': {
      'geosite:cn': ['tls://223.5.5.5:853'], // 国内 DoT
      'geosite:geolocation-!cn': ['tls://1.1.1.1:853'] // 国外 DoT
    },
    'default-nameserver': ['tls://1.1.1.1:853'] // 备用 DoT
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

  globalProxies.push(...config.proxies.filter(({ name }) => sgRegex.test(name)).map(p => p.name));

  return { ...config, ...BASE_CONFIG };
}
