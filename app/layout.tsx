import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import Script from 'next/script'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Figma AI Assistant | Instant Design Help & UI Automation",
  description: "Get expert answers to Figma questions and automate UI component creation. Design smarter and faster with AI-powered assistance for all skill levels.",
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
    title: "Figma AI Assistant | Instant Design Help & UI Automation",
    description: "Get expert answers to Figma questions and automate UI component creation. Design smarter and faster with AI-powered assistance for all skill levels.",
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
    title: "Figma AI Assistant | Instant Design Help & UI Automation",
    description: "Get expert answers to Figma questions and automate UI component creation. Design smarter and faster with AI-powered assistance for all skill levels.",
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
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </html>
  );
}



// Long description 1
// Figma AI Assistant transforms how designers work by providing instant answers to Figma questions and automating UI component creation. Skip the learning curve and design documentation—simply ask and create. Whether you're troubleshooting design issues, seeking best practices, or wanting to generate components on the fly, this AI-powered tool streamlines your workflow and boosts productivity. Elevate your Figma experience with intelligent assistance that helps you design smarter, not harder.

// Lomg description 2
// Figma AI Assistant is your intelligent design companion that provides instant answers to all your Figma questions while automating UI component creation. It eliminates hours of searching through documentation and tutorials, allowing you to focus on what matters—creating exceptional designs. Perfect for both beginners and professionals, this tool helps you overcome technical hurdles, implement best practices, and accelerate your workflow with AI-powered guidance. Design smarter and faster with Figma AI Assistant.

// Short description
// Figma AI Assistant delivers instant answers to your Figma questions and automates UI component creation. Skip the documentation and design faster with AI-powered guidance. Perfect for beginners and professionals alike, it's your intelligent companion for streamlining workflows and enhancing productivity.