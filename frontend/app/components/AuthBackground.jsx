export default function AuthBackground({ children }) {
  return (
     <div className="relative min-h-screen items-center justify-center flex flex-col bg-gradient-to-br from-[#060012] via-[#0b0224] to-[#12002b] overflow-hidden">

      {/* Background Glow Effects */}
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-purple-600 opacity-30 rounded-full blur-[140px]" />
      <div className="absolute top-[150px] right-[-120px] w-[380px] h-[380px] bg-indigo-500 opacity-30 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-120px] left-[45%] w-[380px] h-[380px] bg-fuchsia-600 opacity-25 rounded-full blur-[140px]" />

      {children}
    </div>
  );
}
