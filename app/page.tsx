export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-6xl font-black tracking-tight text-white">
          CLU<span className="text-red-500">TCH</span>
        </h1>
      </div>

      {/* Slogan */}
      <p className="text-zinc-400 text-xl mb-2 tracking-widest uppercase text-center">
        be spontaneous
      </p>

      {/* Description */}
      <p className="text-zinc-500 text-base text-center max-w-xs mt-6 leading-relaxed">
        Un café. Maintenant. Près d&apos;ici.
      </p>

      {/* CTA */}
      <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
        <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-2xl text-lg transition-colors">
          Je rejoins la liste d&apos;attente
        </button>
        <button className="w-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 font-medium py-4 rounded-2xl text-base transition-colors">
          En savoir plus
        </button>
      </div>

      {/* Badge */}
      <p className="mt-16 text-zinc-700 text-sm">
        Lausanne · Suisse romande · Lancement 2025
      </p>
    </div>
  );
}
