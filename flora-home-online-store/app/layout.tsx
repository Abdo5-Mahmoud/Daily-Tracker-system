import type { Metadata } from "next";
import { Alexandria } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-alexandria",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flora Home | تنسيق ليليام جاهز",
  description: "تنسيق ورد ليليام صناعي جاهز للمكتب والمنزل.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={alexandria.variable}>
      <body className={alexandria.className}>{children}</body>
    </html>
  );
}
