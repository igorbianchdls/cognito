import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/Relatórios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
      {
        source: '/relatórios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
      {
        source: '/relatorios',
        destination: '/modulos/relatorios',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
