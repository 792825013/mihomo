/**
 * Clash Verge Rev / Mihomo Party 扩展脚本（个人优化版，主用新加坡分组，新增日本分组，VLESS 和 Hysteria2 协议，适配中国家用网络）
 * 当前日期: 2025年2月26日
 */
const REGIONS = [
  ['SG新加坡', /新加坡|🇸🇬|sg|singapore/i, 'Singapore'],
  ['JP日本', /日本|🇯🇵|jp|japan/i, 'Japan'],
].map(([name, regex, icon]) => ({ name, regex, icon: `https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/${icon}.png` }));

const STATIC_CONFIGS = {
  base: { mode: 'rule', 'tcp-concurrent': true, 'geo-auto-update': true, 'geo-update-interval': 168, 'log-level': 'warning' },
  dns: {
    enable: true, listen: ':1053', 'enhanced-mode': 'fake-ip',
    nameserver: ['223.5.5.5', '114.114.114.114'], fallback: ['tls://8.8.8.8'],
    'nameserver-policy': { 'geosite:cn': ['223.5.5.5', '114.114.114.114'], 'geosite:geolocation-!cn': ['tls://8.8.8.8'] }
  },
  proxyGroupDefault: { interval: 300, timeout: 3000, url: 'http://www.gstatic.com/generate_204' },
  rules: ['GEOIP,private,DIRECT,no-resolve', 'GEOSITE,cn,DIRECT', 'GEOIP,cn,DIRECT,no-resolve', 'MATCH,GLOBAL'],
  geoxUrl: {
    geoip: 'https://github.com/Loyalsoldier/geoip/releases/latest/download/geoip-only-cn-private.dat',
    geosite: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat'
  }
};

function main(config) {
  if (!config?.proxies?.length) throw new Error('未找到代理节点');
  const proxies = config.proxies.filter(p => p.type.toLowerCase() === 'vless' ? p.tls : p.type.toLowerCase() === 'hysteria2').map(p => p.name);
  Object.assign(config, STATIC_CONFIGS.base, { dns: STATIC_CONFIGS.dns, 'geox-url': STATIC_CONFIGS.geoxUrl });

  const regionGroups = REGIONS.map(r => ({
    ...STATIC_CONFIGS.proxyGroupDefault, name: r.name, type: 'url-test', tolerance: 50, icon: r.icon,
    proxies: proxies.filter(name => r.regex.test(name))
  })).filter(g => g.proxies.length);

  const otherNodes = proxies.filter(name => !REGIONS.some(r => r.regex.test(name)));
  const globalProxies = regionGroups.length ? ['SG新加坡', 'JP日本'] : proxies;
  const proxyGroups = [{
    ...STATIC_CONFIGS.proxyGroupDefault, name: 'GLOBAL', type: 'select',
    proxies: [...globalProxies, ...(otherNodes.length ? ['其他节点'] : [])],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png'
  }, ...regionGroups];

  if (otherNodes.length) {
    proxyGroups.push({
      ...STATIC_CONFIGS.proxyGroupDefault, name: '其他节点', type: 'select', proxies: otherNodes,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png'
    });
  }

  config['proxy-groups'] = proxyGroups;
  config.rules = STATIC_CONFIGS.rules;
  return config;
}
