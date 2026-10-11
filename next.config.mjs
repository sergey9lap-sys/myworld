export default {
  devIndicators: false,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/book', destination: '/p/book/index.html' },
      { source: '/book/:path*', destination: '/p/book/:path*' },
      { source: '/p/:client', destination: '/p/:client/index.html' },
      { source: '/st-kids', destination: '/st-kids/index.html' },
      { source: '/st-kids/:page', destination: '/st-kids/index.html' },
    ];
  },
};
