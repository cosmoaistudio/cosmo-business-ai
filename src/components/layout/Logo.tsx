export default function Logo() {
  return (
    <div className="flex items-center gap-4">

      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-400 shadow-lg shadow-blue-600/30 transition duration-700 hover:rotate-[360deg]"
      >
        <span className="text-3xl font-black text-white">
          C
        </span>
      </div>

      <div>

        <h1 className="text-xl font-black tracking-widest text-white">
          COSMO
        </h1>

        <p className="text-sm text-slate-400">
          Business AI
        </p>

        <span className="text-[11px] text-blue-400">
          O futuro da gestão começa aqui.
        </span>

      </div>

    </div>
  );
}