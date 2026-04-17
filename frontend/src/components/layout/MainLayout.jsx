import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#132238] font-sans text-white">
      <Navbar />
      <main className="w-full">{children}</main>
    </div>
  );
}