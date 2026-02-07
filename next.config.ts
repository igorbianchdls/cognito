import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/modulos',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/modulos/:path*',
        destination: '/erp/:path*',
        permanent: false,
      },
      {
        source: '/Relatórios',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/relatórios',
        destination: '/erp',
        permanent: false,
      },
      {
        source: '/relatorios',
        destination: '/erp',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
