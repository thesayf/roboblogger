import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lora"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roboblogger.com"),
  title: {
    template: "%s | RoboBlogger",
    default: "RoboBlogger - AI-Powered Blog CMS",
  },
  description:
    "Generate beautiful blog posts with AI. Rich components, SEO optimization, and scheduled publishing.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "RoboBlogger",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#111827",
          colorText: "#111827",
          colorTextSecondary: "#6B7280",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#111827",
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: "14px",
          borderRadius: "6px",
        },
        elements: {
          card: {
            boxShadow: "none",
            border: "1px solid #E5E7EB",
          },
          headerTitle: {
            fontFamily: '"Lora", Georgia, serif',
            fontSize: "24px",
            fontWeight: "400",
            color: "#111827",
          },
          headerSubtitle: {
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            color: "#6B7280",
            fontWeight: "400",
          },
          socialButtonsBlockButton: {
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            color: "#111827",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: "400",
            boxShadow: "none",
          },
          dividerLine: {
            backgroundColor: "#E5E7EB",
          },
          dividerText: {
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "12px",
            color: "#9CA3AF",
            fontWeight: "400",
          },
          formFieldLabel: {
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            color: "#374151",
            fontWeight: "500",
            marginBottom: "6px",
          },
          formFieldInput: {
            border: "1px solid #D1D5DB",
            backgroundColor: "#FFFFFF",
            color: "#111827",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            boxShadow: "none",
          },
          formButtonPrimary: {
            backgroundColor: "#111827",
            color: "#FFFFFF",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: "500",
            border: "none",
            boxShadow: "none",
          },
          footerActionLink: {
            color: "#111827",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: "500",
          },
          footerActionText: {
            color: "#6B7280",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
          },
          footer: {
            display: "none",
          },
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} ${lora.variable}`}>
          {children}
          <Toaster richColors position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
