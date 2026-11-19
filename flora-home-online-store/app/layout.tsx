import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flora Home | تنسيق ليليام جاهز",
  description: "تنسيق ورد ليليام صناعي جاهز للمكتب والمنزل.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
