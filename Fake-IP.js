function main(config) {
  const proxies = config.proxies?.map(p => p.name) || [];
  if (!proxies.length) throw new Error('未找到代理节点');

  Object.assign(config, {
    mode: 'rule',
    dns: {
      enable: true,
      listen: '0.0.0.0:53',
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'nameserver-policy': { 
        'geosite:cn': ['https://223.5.5.5/dns-query'],
        'geosite:geolocation-!cn': ['https://8.8.8.8/dns-query']
      },
      'default-nameserver': ['223.5.5.5'],
      fallback: ['https://8.8.8.8/dns-query']
    },
    'proxy-groups': [
      { name: 'GLOBAL', type: 'select', proxies: [] }
    ],
    rules: ['GEOIP,private,DIRECT,no-resolve', 'GEOSITE,cn,DIRECT', 'GEOIP,cn,DIRECT,no-resolve', 'MATCH,GLOBAL']
  });

  const groups = config['proxy-groups'];
  const sgProxies = proxies.filter(p => /新加坡|🇸🇬|sg|singapore/i.test(p));
  const jpProxies = proxies.filter(p => /日本|🇯🇵|jp|japan/i.test(p));
  const otherProxies = proxies.filter(p => !/新加坡|🇸🇬|sg|singapore|日本|🇯🇵|jp|japan/i.test(p));

  if (sgProxies.length) groups.push({ name: 'SG新加坡', type: 'url-test', proxies: sgProxies });
  if (jpProxies.length) groups.push({ name: 'JP日本', type: 'url-test', proxies: jpProxies });
  if (otherProxies.length) groups.push({ name: '其他节点', type: 'select', proxies: otherProxies });

  groups[0].proxies = (sgProxies.length || jpProxies.length) ? ['SG新加坡', 'JP日本', ...(otherProxies.length ? ['其他节点'] : [])].filter(g => groups.some(x => x.name === g)) : proxies;

  return config;
}
