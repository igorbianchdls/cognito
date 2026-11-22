import localFont from "next/font/local"

/** Inter for the Otto menu (bundled from Fontsource, OFL; see src/fonts/licenses/inter.txt). */
export const sidebarFont = localFont({
  src: [{ path: "../../fonts/inter.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-sidebar",
  display: "swap",
})
