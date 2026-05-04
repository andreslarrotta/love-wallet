export const metadata = {
  title: "Hello World App",
  description: "A beautiful Hello World created with Next.js and Tailwind CSS v4",
};

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] overflow-hidden font-sans">
      <main className="text-center p-16 bg-white/5 backdrop-blur-lg border border-white/10 rounded-[24px] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-in fade-in slide-in-from-bottom-5 duration-1000">
        <h1 className="text-8xl font-extrabold mb-4 bg-gradient-to-r from-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent animate-pulse">
          Hello, World!
        </h1>
        <p className="text-2xl text-[#e0e0e0] mb-10 font-light tracking-widest">
          Welcome to your new Next.js project.
        </p>
        <button className="px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#4facfe] to-[#00f2fe] rounded-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,242,254,0.6)] shadow-[0_4px_15px_rgba(0,242,254,0.4)]">
          Get Started
        </button>
      </main>
    </div>
  );
}
