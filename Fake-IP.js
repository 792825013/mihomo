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
    { name: 'GLOBAL', type: 'select', proxies: ['SG new Singapore', 'JP new Japan', 'other nodes'] },
    { name: 'SG new Singapore', type: 'url-test', proxies: [] },
    { name: 'JP new Japan', type: 'url-test', proxies: [] },
    { name: 'other nodes', type: 'select', proxies: [] }
  ]
};

const SG_REGEX = /singapore|sg|🇸🇬/i;
const JP_REGEX = /japan|jp|🇯🇵/i;

function main(config) {
  const proxies = config.proxies;
  const groups = BASE_CONFIG['proxy-groups'];
  let i = 0;
  while (i < proxies.length) {
    const name = proxies[i++].name;
    const group = SG_REGEX.test(name) ? groups[1].proxies : JP_REGEX.test(name) ? groups[2].proxies : groups[3].proxies;
    group[group.length] = name;
  }
  Object.assign(config, BASE_CONFIG);
  return config;
}
