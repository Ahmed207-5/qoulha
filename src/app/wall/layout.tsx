import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الحائط العام | قولها",
  description:
    "شارك رأيك، تفاعل مع مساحة اليوم، واكتشف رسائل ومنشورات المجتمع.",

  openGraph: {
    title: "الحائط العام | قولها",
    description:
      "شارك رأيك، تفاعل مع مساحة اليوم، واكتشف رسائل ومنشورات المجتمع.",
    images: [
      {
        url: "/og-wall.png",
        width: 1200,
        height: 630,
        alt: "الحائط العام | قولها",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    images: ["/og-wall.png"],
  },
};

export default function WallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}