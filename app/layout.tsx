import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarketingOS AI",
    template: "%s · MarketingOS AI",
  },
  description: "Your AI marketing agency, orchestrated from one workspace.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0F172A",
              color: "#F8FAFC",
              border: "1px solid #1E293B",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            },
            success: {
              iconTheme: { primary: "#6366F1", secondary: "#F8FAFC" },
              style: { borderLeft: "3px solid #6366F1" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#F8FAFC" },
              style: { borderLeft: "3px solid #EF4444" },
              duration: 6000,
            },
            loading: {
              iconTheme: { primary: "#6366F1", secondary: "#0F172A" },
              style: { borderLeft: "3px solid #6366F1" },
            },
          }}
        />
        <RouteProgress />
        <div className="animate-in fade-in duration-200">{children}</div>
      </body>
    </html>
  );
}
