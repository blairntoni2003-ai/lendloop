import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LendLoop",
  description: "Prêtez et empruntez des outils entre voisins en toute confiance.",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>{props.children}</Providers>
      </body>
    </html>
  );
}
