/**
 * Clash Verge Rev / Mihomo Party 扩展脚本（极致优化版，适配中国网络）
 * 当前日期: 2025年2月23日
 */

/** 地区定义（增强对中国地区的识别） */
const REGIONS = [
  ['HK香港', /港|🇭🇰|hk|hongkong|hong kong/i, 'Hong_Kong'],
  ['US美国', /美|🇺🇸|us|united state|america/i, 'United_States'],
  ['JP日本', /日本|🇯🇵|jp|japan/i, 'Japan'],
  ['KR韩国', /韩|🇰🇷|kr|korea/i, 'Korea'],
  ['SG新加坡', /新加坡|🇸🇬|sg|singapore/i, 'Singapore'],
  ['CN中国大陆', /中国|🇨🇳|cn|china|大陆/i, 'China_Map'], // 增强大陆识别
  ['TW台湾省', /台湾|🇹🇼|tw|taiwan|tai wan/i, 'China'], // 独立台湾分组
].map(([name, regex, icon]) => ({
  name,
  regex,
  icon: `https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/${icon}.png`
}));

/** 静态配置集合（适配中国网络） */
const STATIC_CONFIGS = {
  base: {
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    profile: { 'store-selected': true, 'store-fake-ip': true },
    'unified-delay': true,
    'tcp-concurrent': true,
    'keep-alive-interval': 1800,
    'find-process-mode': 'strict',
    'geodata-mode': true,
    'geodata-loader': 'memconservative',
    'geo-auto-update': true,
    'geo-update-interval': 24
  },
  dns: {
    enable: true,
    listen: ':1053',
    ipv6: false, // 中国网络下关闭 IPv6，避免不稳定
    'prefer-h3': true,
    'use-hosts': true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': ['*', '+.lan', '+.local', '+.market.xiaomi.com'],
    nameserver: ['tls://223.5.5.5', 'tls://119.29.29.29'], // 优先中国 DNS
    fallback: ['tls://8.8.8.8', 'tls://1.1.1.1'], // 备用国际 DNS
    'proxy-server-nameserver': ['tls://223.5.5.5', 'tls://119.29.29.29'],
    'nameserver-policy': {
      'geosite:private': 'system',
      'geosite:cn,steam@cn,category-games@cn,microsoft@cn,apple@cn': ['223.5.5.5', '119.29.29.29'],
      'geosite:gfw': ['tls://8.8.8.8', 'tls://1.1.1.1'] // GFW 域名走国际 DNS
    }
  },
  sniffer: {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] }
    },
    'skip-domain': ['Mijia Cloud', '+.oray.com']
  },
  proxyGroupDefault: {
    interval: 300,
    timeout: 3000,
    url: 'http://www.gstatic.com/generate_204', // 替换为 Google 延迟测试，备用中国可访问地址
    'fallback-url': 'http://www.baidu.com', // 中国网络备用测试
    lazy: true,
    'max-failed-times': 3
  },
  defaultRules: [
    'GEOSITE,private,DIRECT',
    'GEOIP,private,DIRECT,no-resolve',
    'GEOSITE,cn,DIRECT',
    'GEOIP,cn,DIRECT,no-resolve',
    'MATCH,默认节点'
  ],
  geoxUrl: {
    geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
    geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
    mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb',
    asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb'
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
 * 主函数：高效生成 Mihomo 兼容配置，适配中国网络
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
    ntp: { enable: true, server: 'cn.ntp.org.cn' },
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
          MATCH_CACHE.set(name, group); // 缓存匹配结果
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
    name: '默认节点',
    type: 'select',
    proxies: [
      ...regionGroups.map(g => g.name),
      ...(otherNodes.size ? ['其他节点'] : [])
    ],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure/IconSet/Color/Proxy.png'
  }, ...regionGroups];

  // 添加其他节点组
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
