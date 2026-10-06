import { Source_Serif_4 } from "next/font/google";

// Scoped to the home page and footer; other product screens keep their UI font.
export const editorialSerif = Source_Serif_4({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});
