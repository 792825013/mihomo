/**
 * Clash Verge Rev / Mihomo Party 扩展脚本（高效版，主用新加坡和日本，防 DNS 泄漏）
 * 当前日期: 2025年2月26日
 */
const REGIONS = [
  ['SG新加坡', /新加坡|🇸🇬|sg|singapore/i, 'Singapore'],
  ['JP日本', /日本|🇯🇵|jp|japan/i, 'Japan'],
].map(([name, regex, icon]) => ({ name, regex, icon: `https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/${icon}.png` }));

const STATIC_CONFIGS = {
  base: { mode: 'rule', 'tcp-concurrent': true, 'log-level': 'warning' },
  dns: {
    enable: true,
    listen: '0.0.0.0:53',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'nameserver-policy': {
      'geosite:cn': ['https://120.53.53.53/dns-query', 'https://https://223.5.5.5/dns-query'],
      'geosite:geolocation-!cn': ['https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query']
    },
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    fallback: ['https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query'],
    'fallback-filter': { geoip: true, ipcidr: ['240.0.0.0/4', '0.0.0.0/32'] }
  },
  proxyGroupDefault: { interval: 300, timeout: 3000, url: 'http://www.gstatic.com/generate_204' },
  rules: ['GEOIP,private,DIRECT,no-resolve', 'GEOSITE,cn,DIRECT', 'GEOIP,cn,DIRECT,no-resolve', 'MATCH,GLOBAL']
};

function main(config) {
  if (!config?.proxies?.length) throw new Error('未找到代理节点');
  const proxies = config.proxies
    .filter(p => p.type.toLowerCase() === 'vless' ? p.tls : p.type.toLowerCase() === 'hysteria2')
    .map(p => p.name);

  Object.assign(config, STATIC_CONFIGS.base, { dns: STATIC_CONFIGS.dns });

  const regionGroups = REGIONS.map(r => ({
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: r.name,
    type: 'url-test',
    tolerance: 50,
    icon: r.icon,
    proxies: proxies.filter(name => r.regex.test(name))
  })).filter(g => g.proxies.length);

  const otherNodes = proxies.filter(name => !REGIONS.some(r => r.regex.test(name)));
  const globalProxies = regionGroups.length ? ['SG新加坡', 'JP日本'] : proxies;
  const proxyGroups = [{
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: 'GLOBAL',
    type: 'select',
    proxies: [...globalProxies, ...(otherNodes.length ? ['其他节点'] : [])],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png'
  }, ...regionGroups];

  if (otherNodes.length) {
    proxyGroups.push({
      ...STATIC_CONFIGS.proxyGroupDefault,
      name: '其他节点',
      type: 'select',
      proxies: otherNodes,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png'
    });
  }

  config['proxy-groups'] = proxyGroups;
  config.rules = STATIC_CONFIGS.rules;
  return config;
}
