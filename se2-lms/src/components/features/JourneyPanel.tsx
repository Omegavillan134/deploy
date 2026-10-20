import Icon from "@/components/ui/Icon";

const checklist = [
  "Join classes with a simple class code.",
  "Submit assignments and get feedback online.",
  "Track grades and deadlines in real time.",
  "View your grades and attendance history.",
];

export default function JourneyPanel() {
  return (
    <div>
      <p className="text-xs font-extrabold tracking-[0.25em] text-forest-700 mb-4">CVSU LMS</p>
      <h1 className="text-4xl sm:text-[3.4rem] font-extrabold text-forest-900 tracking-tight leading-[1.1]">
        Your Classes,<br />All in One Place.
      </h1>
      <p className="mt-6 text-[15px] text-ink-soft leading-relaxed max-w-md">
        Keep your classes, assignments, grades, and learning materials organized in
        one platform built for Cavite State University.
      </p>
      <ul className="mt-9 space-y-4">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-mint-100 text-forest-700 shrink-0">
              <Icon name="check" className=" text-sm" />
            </span>
            <span className="text-sm font-medium text-ink">{item}</span>
          </li>
        ))}
      </ul>
<a href="/register" className="btn-primary mt-10">Get Started</a>
    </div>
  );
}
