import Reveal from "@/components/Reveal";
import Icon from "@/components/ui/Icon";

const features = [
  {
    icon: "groups",
    tint: "bg-mint-100 text-forest-700",
    title: "Class Organization",
    body: "Keep every class, material, and announcement in one organized space.",
  },
  {
    icon: "upload_file",
    tint: "bg-sky-50 text-sky-600",
    title: "Easy Submissions",
    body: "Turn in assignments and get feedback without leaving the platform.",
  },
  {
    icon: "monitoring",
    tint: "bg-violet-50 text-violet-600",
    title: "Real-time Grades",
    body: "Track scores and feedback the moment teachers post them.",
  },
  {
    icon: "tune",
    tint: "bg-amber-50 text-amber-600",
    title: "Privacy & Control",
    body: "Control who sees your work and personal information.",
  },
];

export default function Hero() {
  return (
    <section id="home" className="hero-wash overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-mint-100 px-4 py-2 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-700" aria-hidden />
              <span className="text-xs font-bold text-forest-800">Cavite State University Learning Management System</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-[2.6rem] sm:text-6xl lg:text-[4rem] font-extrabold text-forest-900 leading-[1.08] tracking-tight">
              Your Classes.<br />Your Work.<br />Your Grades.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-7 text-[15px] text-ink-soft max-w-md leading-relaxed">
              CVSU LMS helps students and teachers run classes, submit and grade
              coursework, share materials, and track progress — all in one centralized
              platform.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="/register" className="btn-primary">Get Started</a>
              <a href="#features" className="btn-outline bg-white">Explore Features</a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="card !rounded-3xl p-7 sm:p-10 shadow-float">
            <p className="text-xs font-extrabold tracking-[0.22em] text-forest-700 mb-4">WHY CVSU LMS?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-900 tracking-tight leading-tight">
              Built Around<br />Your Learning.
            </h2>
            <p className="mt-4 text-sm text-ink-soft leading-relaxed max-w-sm">
              A simple and organized way to run classes, coursework, and student progress.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-mint-100 bg-white p-5 hover:shadow-card hover:-translate-y-0.5 transition-all">
                  <span className={`icon-chip ${f.tint} mb-3.5`}>
                    <Icon name={String(f.icon)} className="" />
                  </span>
                  <p className="text-sm font-bold text-ink">{f.title}</p>
                  <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
