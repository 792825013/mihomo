const SG_REGEX = /新加坡|🇸🇬|sg|singapore/i;
const JP_REGEX = /日本|🇯🇵|jp|japan/i;
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
    { name: 'GLOBAL', type: 'select', proxies: ['SG新加坡', 'JP日本', '其他节点'] },
    { name: 'SG新加坡', type: 'url-test', proxies: [] },
    { name: 'JP日本', type: 'url-test', proxies: [] },
    { name: '其他节点', type: 'select', proxies: [] }
  ]
};

function main(config) {
  const proxies = config.proxies;
  const groups = BASE_CONFIG['proxy-groups'];
  for (let i = 0, len = proxies.length; i < len; i++) {
    const name = proxies[i].name;
    groups[SG_REGEX.test(name) ? 1 : JP_REGEX.test(name) ? 2 : 3].proxies.push(name);
  }
  Object.assign(config, BASE_CONFIG);
  return config;
}
