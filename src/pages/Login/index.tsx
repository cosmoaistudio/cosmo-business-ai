export default function Login() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl">

        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Cosmo Business AI
        </h1>

        <p className="mb-8 text-slate-500">
          Faça login para continuar.
        </p>

        <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
          Entrar com Google
        </button>

      </div>
    </div>
  );
}