import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICM Layout Tool",
  description: "Children's book text layout editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
