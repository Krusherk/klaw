export default function Home() {
  return (
    <div className="page-enter space-y-8 pb-8">
      <section className="rounded-3xl border border-white/12 bg-[linear-gradient(132deg,rgba(150,28,28,0.26)_0%,rgba(38,15,15,0.78)_48%,rgba(16,16,18,0.88)_100%)] px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.9fr]">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-rose-300/80">Klaw Field</p>
            <h1 className="font-heading text-4xl font-semibold leading-tight md:text-6xl">
              Run a <span className="text-gradient">serious moderation pipeline</span> for story campaigns.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Collect submissions, assign tasks, validate X proof links, and keep outcomes transparent with normal,
              pending, approved, and rejected states.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/stories"
                className="rounded-lg bg-gradient-to-r from-red-600 to-rose-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Open Story Feed
              </a>
              <a
                href="/submit"
                className="rounded-lg border border-white/20 bg-black/20 px-5 py-2.5 text-sm font-semibold text-zinc-100"
              >
                Submit Story
              </a>
            </div>
          </div>

          <div className="grid gap-3 self-end">
            <article className="rounded-2xl border border-white/12 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">Proof Review</p>
              <p className="mt-2 text-xl font-semibold text-white">Manual quality control</p>
              <p className="mt-2 text-sm text-zinc-300">No weak automation. Admin decides outcomes.</p>
            </article>
            <article className="rounded-2xl border border-white/12 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">Privacy</p>
              <p className="mt-2 text-xl font-semibold text-white">Wallet & country kept private</p>
              <p className="mt-2 text-sm text-zinc-300">Visible only to admin for rewards.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">01</p>
          <h2 className="mt-2 font-heading text-xl">Submission Control</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Authenticated users submit one story per UTC day, tied to immutable X usernames.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">02</p>
          <h2 className="mt-2 font-heading text-xl">Task Assignment</h2>
          <p className="mt-2 text-sm text-zinc-300">
            One active task per story keeps state transitions clear and enforceable.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">03</p>
          <h2 className="mt-2 font-heading text-xl">Proof Decisions</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Approve, reject, and reopen with optional decision notes for transparent moderation.
          </p>
        </article>
      </section>
    </div>
  );
}
