import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lora"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://schedulegenius.ai"),
  title: {
    template: "%s | ScheduleGenius",
    default: "ScheduleGenius - AI-Powered Productivity Scheduling",
  },
  description:
    "Create the perfect routine based on proven techniques from top performers",
  icons: {
    icon: "/favicon40x40.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "ScheduleGenius",
    images: [
      {
        url: "/homepage-og.jpg",
        width: 1200,
        height: 630,
        alt: "ScheduleGenius AI Productivity Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ScheduleGenius",
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
        layout: {
          logoImageUrl: "/D (1024 x 1024 px).png",
          logoPlacement: "inside",
        },
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
          // Logo
          logoContainer: {
            width: "200px",
            height: "80px",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          logoImage: {
            width: "180px",
            height: "auto",
            objectFit: "contain",
          },

          // Card container
          card: {
            boxShadow: "none",
            border: "1px solid #E5E7EB",
          },

          // Header
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

          // Social buttons
          socialButtonsBlockButton: {
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            color: "#111827",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: "400",
            boxShadow: "none",
          },
          socialButtonsBlockButton__google: {
            border: "1px solid #E5E7EB",
          },
          socialButtonsBlockButton__apple: {
            border: "1px solid #E5E7EB",
          },

          // Divider
          dividerLine: {
            backgroundColor: "#E5E7EB",
          },
          dividerText: {
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "12px",
            color: "#9CA3AF",
            fontWeight: "400",
          },

          // Form fields
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
          formFieldInput__focused: {
            borderColor: "#111827",
            boxShadow: "0 0 0 1px #111827",
          },

          // Submit button
          formButtonPrimary: {
            backgroundColor: "#111827",
            color: "#FFFFFF",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: "14px",
            fontWeight: "500",
            border: "none",
            boxShadow: "none",
          },
          formButtonPrimary__hover: {
            backgroundColor: "#1F2937",
          },

          // Footer links
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

          // Remove Clerk branding styles
          footer: {
            display: "none",
          },
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} ${lora.variable}`}>
          <AppProvider>
            {children}
            <Toaster richColors position="top-center" />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
