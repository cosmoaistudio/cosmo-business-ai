export default function Topbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500">
          Bem-vindo à Cosmo Business AI 🚀
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="h-11 w-11 rounded-full bg-slate-100 hover:bg-slate-200 transition">
          🔔
        </button>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            F
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              Felipe
            </p>

            <span className="text-sm text-slate-500">
              Administrador
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}