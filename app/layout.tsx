import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Figma AI Assistant",
  description: "Get instant answers to Figma questions. Automate the creation of UI components",
  keywords: ["Figma", "AI", "UI design", "design automation", "UI components", "design assistant"],
  authors: [{ name: "Rafael Saraceni", url: "https://saraceni.me/" }],
  creator: "Rafael Saraceni",
  metadataBase: new URL("https://figma-ai-agent.vercel.app"),
  alternates: {
    canonical: "/",
    languages: {
      'en-US': "/en-us",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Figma AI Assistant",
    description: "Get instant answers to Figma questions. Automate the creation of UI components",
    url: "https://figma-ai-agent.vercel.app/", // Replace with your actual URL
    images: [
      {
        url: "/app_preview.png", // Path to the image in the public folder
        width: 1200, // Optional: specify width
        height: 630, // Optional: specify height
        alt: "Preview Image", // Optional: alt text for the image
      },
      {
        url: "/avatar.png", // Square image for mobile previews
        width: 1200,
        height: 1200,
        alt: "Figma AI Assistant",
      },
    ],
    type: "website",
    locale: "en_US",
    siteName: "Figma AI Assistant",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Figma AI Assistant",
    description: "Get instant answers to Figma questions. Automate the creation of UI components",
    images: ['/app_preview.png'],
    creator: "@saraceni_br",
    site: "@saraceni_br",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
