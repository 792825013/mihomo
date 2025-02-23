/**
 * Clash Verge Rev / Mihomo Party 扩展脚本（优化版，主用新加坡分组，适配中国家用网络）
 * 当前日期: 2025年2月23日
 */

/** 地区定义（精简，仅保留新加坡和中国） */
const REGIONS = [
  ['SG新加坡', /新加坡|🇸🇬|sg|singapore/i, 'Singapore'],
  ['CN中国大陆', /中国|🇨🇳|cn|china|大陆/i, 'China_Map'],
].map(([name, regex, icon]) => ({
  name,
  regex,
  icon: `https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/${icon}.png`
}));

/** 静态配置集合（适配中国家用网络，主用新加坡） */
const STATIC_CONFIGS = {
  base: {
    'allow-lan': true,
    'bind-address': '127.0.0.1',
    mode: 'rule',
    profile: { 'store-selected': true, 'store-fake-ip': true },
    'unified-delay': true,
    'tcp-concurrent': true,
    'keep-alive-interval': 300,
    'find-process-mode': 'strict',
    'geodata-mode': true,
    'geodata-loader': 'standard',
    'geo-auto-update': true,
    'geo-update-interval': 168
  },
  dns: {
    enable: true,
    listen: ':1053',
    ipv6: false,
    'prefer-h3': true,
    'use-hosts': true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'],
    nameserver: ['223.5.5.5', '119.29.29.29'], // 国内不加密，速度快
    fallback: ['tls://8.8.8.8', 'tls://1.1.1.1'], // 国外加密，备用
    'proxy-server-nameserver': ['tls://8.8.8.8', 'tls://1.1.1.1'], // 代理用国外加密DNS
    'nameserver-policy': {
    'geosite:private': 'system',          // 本地不加密
    'geosite:cn': ['223.5.5.5', '119.29.29.29'], // 国内不加密
    'geosite:geolocation-!cn': ['tls://8.8.8.8', 'tls://1.1.1.1'] // 国外加密
    }
  },
  sniffer: {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    sniff: {
      TLS: { ports: [443] },
      HTTP: { ports: [80] },
      QUIC: { ports: [443] }
    },
    'skip-domain': ['Mijia Cloud', '+.oray.com', '+.baidu.com', '+.taobao.com']
  },
  proxyGroupDefault: {
    interval: 300,
    timeout: 3000,
    url: 'http://www.gstatic.com/generate_204',
    'fallback-url': 'http://www.baidu.com',
    lazy: true,
    'max-failed-times': 3
  },
  defaultRules: [
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',
    'MATCH,SG新加坡'                    // 默认走新加坡
  ],
  geoxUrl: {
    geoip: 'https://github.com/Loyalsoldier/geoip/releases/latest/download/geoip-only-cn-private.dat',
    geosite: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat'
  }
};

/** 预构建地区映射表 */
const REGION_LOOKUP = new Map(
  REGIONS.map((region, index) => [index, {
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: region.name,
    type: 'url-test',
    tolerance: 50,
    icon: region.icon,
    proxies: [],
    regex: region.regex
  }])
);

/** 正则匹配缓存 */
const MATCH_CACHE = new Map();

/**
 * 主函数：高效生成 Mihomo 兼容配置，主用新加坡分组
 * @param {Object} config 输入配置对象
 * @returns {Object} 处理后的配置对象
 */
function main(config) {
  // 输入验证
  if (!config || (!config.proxies?.length && !config['proxy-providers'])) {
    throw new Error('配置文件中未找到任何代理');
  }
  config.proxies = config.proxies || [];

  // 合并基础配置
  Object.assign(config, STATIC_CONFIGS.base, {
    dns: STATIC_CONFIGS.dns,
    sniffer: STATIC_CONFIGS.sniffer,
    'geox-url': STATIC_CONFIGS.geoxUrl
  });

  // 提取代理名称并分组
  const proxyNames = config.proxies.map(p => p.name);
  const otherNodes = new Set(proxyNames);
  const regionGroups = [];

  // 初始化地区分组
  const regionMap = new Map();
  REGION_LOOKUP.forEach((group, key) => regionMap.set(key, { ...group, proxies: [] }));

  // 单次遍历分组，使用缓存优化正则匹配
  for (const name of proxyNames) {
    let matchedRegion = MATCH_CACHE.get(name);
    if (!matchedRegion) {
      for (const [_, group] of regionMap) {
        if (group.regex.test(name)) {
          matchedRegion = group;
          MATCH_CACHE.set(name, group);
          break;
        }
      }
    }
    if (matchedRegion) {
      matchedRegion.proxies.push(name);
      otherNodes.delete(name);
    }
  }

  // 收集有效地区组
  for (const [_, group] of regionMap) {
    if (group.proxies.length) {
      regionGroups.push(group);
    }
  }

  // 构建代理组
  const proxyGroups = [{
    ...STATIC_CONFIGS.proxyGroupDefault,
    name: 'GLOBAL',
    type: 'select',
    proxies: [
      'SG新加坡',                       // 优先新加坡
      ...(otherNodes.size ? ['其他节点'] : []) // 未分组节点
    ],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png'
  }, ...regionGroups];

  // 添加其他节点组（未分组的代理）
  if (otherNodes.size) {
    proxyGroups.push({
      ...STATIC_CONFIGS.proxyGroupDefault,
      name: '其他节点',
      type: 'select',
      proxies: Array.from(otherNodes),
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/World_Map.png'
    });
  }

  // 更新配置
  config.proxies.push({ name: '直连', type: 'direct', udp: true });
  config['proxy-groups'] = proxyGroups;
  config.rules = STATIC_CONFIGS.defaultRules;

  return config;
}
