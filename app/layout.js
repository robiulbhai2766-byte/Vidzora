export const metadata = {
  title: "Vidzora",
  description: "Create, Share, Watch and Earn",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
