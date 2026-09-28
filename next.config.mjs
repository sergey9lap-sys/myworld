export default {
  devIndicators: false,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/p/:client', destination: '/p/:client/index.html' },
      { source: '/st-kids', destination: '/st-kids/index.html' },
      { source: '/st-kids/:page', destination: '/st-kids/index.html' },
    ];
  },
};
