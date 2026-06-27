import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const thaiFont = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "QMS",
  description: "ระบบบริหารคุณภาพ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="th" className={`${thaiFont.variable} h-full bg-slate-50`}>
      <body className="min-h-full font-sans text-slate-900 antialiased">
        {session ? (
          <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
            <Sidebar role={session.role} />
            <div className="min-w-0">
              <Header user={session} />
              <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
