/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' retiré pour permettre les routes dynamiques [id]
  // Avec ce changement, Next.js peut générer les pages à la demande (SSR)
  // au lieu de devoir tout pré-générer au moment du build.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig