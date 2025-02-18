import type {Metadata} from "next";
import "material-symbols"
import "./globals.css";
import {ReduxProvider} from "@/store";

export const metadata: Metadata = {
  title: "VisPilot",
  description: "VisPilot demo",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body>
    <ReduxProvider>
      {children}
    </ReduxProvider>
    </body>
    </html>
  );
}
