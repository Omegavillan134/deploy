import Reveal from "@/components/Reveal";
import Icon from "@/components/ui/Icon";

const items = [
  {
    icon: "groups",
    tint: "bg-mint-100 text-forest-700",
    title: "Class Management",
    body: "Create classes, post announcements, and share materials with students.",
  },
  {
    icon: "assignment",
    tint: "bg-sky-50 text-sky-600",
    title: "Assignment Tracking",
    body: "Post assignments with due dates and collect submissions online.",
  },
  {
    icon: "grading",
    tint: "bg-violet-50 text-violet-600",
    title: "Grades & Feedback",
    body: "Grade submissions, give feedback, and return work for revision.",
  },
  {
    icon: "shield",
    tint: "bg-amber-50 text-amber-600",
    title: "Privacy & Visibility",
    body: "Manage profile visibility and protect sensitive personal information.",
  },
];

export default function SystemFeatures() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 lg:py-24">
        <Reveal className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-extrabold tracking-[0.25em] text-forest-700 mb-4">SYSTEM FEATURES</p>
            <h2 className="text-3xl sm:text-[2.6rem] font-extrabold text-forest-900 tracking-tight leading-tight">
              Everything You Need<br className="hidden sm:block" /> In Your Classes.
            </h2>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed max-w-xs lg:pb-1">
            Manage coursework, materials, and student progress through a simple and organized platform.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <article className="card p-7 flex gap-5 h-full hover:shadow-float hover:-translate-y-0.5 transition-all">
                <span className={`icon-chip ${f.tint} shrink-0`}>
                  <Icon name={String(f.icon)} className=" text-[24px]" />
                </span>
                <div className="flex flex-col">
                  <h3 className="font-bold text-forest-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft leading-relaxed flex-1">{f.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
