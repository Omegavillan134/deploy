import Reveal from "@/components/Reveal";
import Icon from "@/components/ui/Icon";

const cards = [
  {
    icon: "school",
    tint: "bg-mint-100 text-forest-700",
    title: "Organized Classes",
    body: "Join classes with a code and find materials, announcements, and assignments in one stream.",
  },
  {
    icon: "assignment_turned_in",
    tint: "bg-mint-50 text-forest-700",
    title: "Simple Submissions",
    body: "Submit work online and receive grades and feedback in real time.",
  },
  {
    icon: "shield_lock",
    tint: "bg-mint-100 text-forest-700",
    title: "Privacy Focused",
    body: "Manage profile visibility and control which information can be viewed by others.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 py-20 lg:py-28">
      <Reveal className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-xs font-extrabold tracking-[0.25em] text-forest-700 mb-4">ABOUT CVSU LMS</p>
        <h2 className="text-3xl sm:text-[2.6rem] font-extrabold text-forest-900 tracking-tight">
          Everything About Your Classes, In One Place.
        </h2>
        <p className="mt-5 text-sm text-ink-soft leading-relaxed">
          CVSU LMS gives students and teachers one place to manage classes, coursework,
          grades, and learning materials.
        </p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 120}>
            <article className="card p-8 h-full hover:shadow-float hover:-translate-y-1 transition-all">
              <span className={`icon-chip ${c.tint} mb-6`}>
                <Icon name={String(c.icon)} className=" text-[24px]" />
              </span>
              <h3 className="text-lg font-bold text-forest-900">{c.title}</h3>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">{c.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
