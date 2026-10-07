import { Source_Serif_4 } from "next/font/google";

// Shared editorial typeface for the Athenaeum brand across every route.
export const editorialSerif = Source_Serif_4({
  variable: "--font-editorial-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});
