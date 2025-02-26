/**
 * Clash Verge Rev / Mihomo Party 扩展脚本（优化版，主用新加坡分组，新增日本分组，VLESS 和 Hysteria2 协议，适配中国家用网络）
 * 当前日期: 2025年2月26日
 */

/** 地区定义（仅保留新加坡和日本） */
const REGIONS = [
  ['SG新加坡', /新加坡|🇸🇬|sg|singapore/i, 'Singapore'],
  ['JP日本', /日本|🇯🇵|jp|japan/i, 'Japan'],
].map(([name, regex, icon]) => ({
  name,
  regex,
  icon: `https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/${icon}.png`
}));

/** 静态配置集合（精简版，主用新加坡，适配中国家用网络） */
const STATIC_CONFIGS = {
  base: {
    'allow-lan': true,
    mode: 'rule',
    'tcp-concurrent': true,
    'geo-auto-update': true,
    'geo-update-interval': 168
  },
  dns: {
    enable: true,
    listen: ':1053',
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    nameserver: ['223.5.5.5', '114.114.114.114'],
    fallback: ['tls://8.8.8.8'],
    'nameserver-policy': {
      'geosite:cn': ['223.5.5.5', '114.114.114.114'],
      'geosite:geolocation-!cn': ['tls://8.8.8.8']
    }
  },
  proxyGroupDefault: {
    interval: 300,
    timeout: 3000,
    url: 'http://www.gstatic.com/generate_204',
    lazy: true
  },
  rules: [
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',
    'MATCH,GLOBAL'
  ],
  geoxUrl: {
    geoip: 'https://github.com/Loyalsoldier/geoip/releases/latest/download/geoip-only-cn-private.dat',
    geosite: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat'
  }
};

/** 主函数：高效生成 Mihomo 兼容配置 */
function main(config) {
  if (!config?.proxies?.length) throw new Error('未找到代理节点');

  // 筛选 VLESS 和 Hysteria2 安全节点
  const proxies = config.proxies.filter(p => {
    const type = p.type.toLowerCase();
    return (type === 'vless' && p.tls) || type === 'hysteria2';
  }).map(p => p.name);

  // 合并基础配置
  Object.assign(config, STATIC_CONFIGS.base, {
    dns: STATIC_CONFIGS.dns,
    'geox-url': STATIC_CONFIGS.geoxUrl
  });

  // 分组逻辑
  const regionGroups = REGIONS.map(r => ({
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: r.name,
    type: 'url-test',
    tolerance: 100,
    icon: r.icon,
    proxies: proxies.filter(name => r.regex.test(name))
  })).filter(g => g.proxies.length);

  const otherNodes = proxies.filter(name => !REGIONS.some(r => r.regex.test(name)));
  const proxyGroups = [{
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: 'GLOBAL',
    type: 'select',
    proxies: ['SG新加坡', 'JP日本', ...(otherNodes.length ? ['其他节点'] : [])],
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
  config.rules = STATIC_CONFIGS.defaultRules;
  return config;
}
