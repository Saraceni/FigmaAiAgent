import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Figma AI Assistant",
  description: "Ask Figma documentation and get answers in seconds",
  openGraph: {
    title: "Figma AI Assistant",
    description: "Ask Figma documentation and get answers in seconds",
    url: "https://figma-ai-agent.vercel.app/", // Replace with your actual URL
    images: [
      {
        url: "/url_preview.png", // Path to the image in the public folder
        width: 1200, // Optional: specify width
        height: 600, // Optional: specify height
        alt: "Preview Image", // Optional: alt text for the image
      },
      {
        url: "/avatar.png", // Square image for mobile previews
        width: 1200,
        height: 1200,
        alt: "Figma AI Assistant",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Figma AI Assistant",
    description: "Ask Figma documentation and get answers in seconds",
    images: ['/url_preview.png'],
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
