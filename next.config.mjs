export default {
  devIndicators: false,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/p/:client', destination: '/p/:client/index.html' },
    ];
  },
};
