const BASE_CONFIG = {
  mode: 'rule',
  dns: {
    enable: true,
    listen: '0.0.0.0:53', // 监听标准 DNS 端口
    'enhanced-mode': 'fake-ip', // 使用虚拟 IP 防泄露
    'fake-ip-range': '198.18.0.1/16', // 防止 IP 冲突
    'fake-ip-filter': ['*.lan', '*.localdomain', '+.home.arpa'], // 过滤本地域名
    'nameserver-policy': {
      'geosite:cn': ['https://223.5.5.5/dns-query', 'https://120.53.53.53/dns-query'], // 国内用阿里和快手 DoH
      'geosite:geolocation-!cn': ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'] // 国外用 Cloudflare 和 Google DoH
    },
    'default-nameserver': ['223.5.5.5'] // 单一备用 DNS
  },
  tun: { // 可选 TUN 模式配置
    enable: true, // 启用 TUN（若不使用可设为 false）
    stack: 'system', // 系统网络栈
    'dns-hijack': ['any:53'] // 劫持所有 DNS 请求
  },
  rules: [
    'GEOIP,private,DIRECT,no-resolve', // 私有网络直连
    'GEOSITE,cn,DIRECT', // 国内网站直连
    'MATCH,GLOBAL' // 其他走代理
  ],
  'proxy-groups': [
    { name: 'GLOBAL', type: 'select', proxies: ['SG新加坡', 'JP日本'] }, // 主选择组
    { name: 'SG新加坡', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300, tolerance: 50 }, // 新加坡自动选择
    { name: 'JP日本', type: 'url-test', proxies: [], url: 'http://www.gstatic.com/generate_204', interval: 300, tolerance: 50 } // 日本自动选择
  ]
};

function main(config) {
  const sgProxies = BASE_CONFIG['proxy-groups'][1].proxies;
  const jpProxies = BASE_CONFIG['proxy-groups'][2].proxies;
  const sgRegex = /(新加坡|🇸🇬)/; // 正则匹配新加坡
  const jpRegex = /(日本|🇯🇵)/; // 正则匹配日本

  config.proxies.forEach(({ name }) => {
    if (sgRegex.test(name)) sgProxies.push(name);
    else if (jpRegex.test(name)) jpProxies.push(name);
  });

  return { ...config, ...BASE_CONFIG };
}
