export default function Home() {
  return (
    <div className="page-enter space-y-8 pb-8">
      <section className="rounded-3xl border border-white/12 bg-[linear-gradient(135deg,rgba(126,102,255,0.18),rgba(58,73,147,0.05)_50%,rgba(19,24,40,0.7)_100%)] px-6 py-12 shadow-[0_18px_60px_-32px_rgba(115,100,255,0.8)] md:px-10">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-violet-300/75">Klaw Field</p>
        <h1 className="font-heading text-4xl font-semibold leading-tight md:text-6xl">
          Moderate story-based tasks with a <span className="text-gradient">clean proof workflow</span>.
        </h1>
        <p className="mt-6 max-w-3xl text-base text-slate-300 md:text-lg">
          Users post stories, you assign tasks, they submit X proof links, and you decide approval status. Every
          state is visible: normal, pending, approved, and rejected.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/stories"
            className="rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Explore Stories
          </a>
          <a
            href="/submit"
            className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100"
          >
            Submit Story
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-heading text-xl">Task Lifecycle</h2>
          <p className="mt-2 text-sm text-slate-300">
            Move stories from normal to pending, then approve or reject after proof review. Reopen rejected cases when
            needed.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-heading text-xl">Proof Discipline</h2>
          <p className="mt-2 text-sm text-slate-300">
            Users provide X status links as proof. Manual moderation keeps quality high while preserving flexibility.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-heading text-xl">Reward Ready</h2>
          <p className="mt-2 text-sm text-slate-300">
            Wallet and country are collected at submission and kept private for admin reward handling.
          </p>
        </article>
      </section>
    </div>
  );
}
