import Icon from "@/components/ui/Icon";
const bar = (w: string) => `h-2.5 rounded-full bg-gray-100 ${w}`;

export default function ClassMockCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-5 bg-gradient-to-tr from-mint-100/70 to-transparent rounded-[2.5rem] blur-2xl" aria-hidden />
      <div className="card relative !rounded-3xl shadow-float overflow-hidden">
        <div className="flex items-center gap-3 px-8 pt-7 pb-5 border-b border-mint-50">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-forest-800 text-white font-extrabold text-sm">C</span>
          <span className="leading-none">
            <span className="block text-sm font-extrabold tracking-wide text-forest-900">CVSU LMS</span>
            <span className="block text-[9px] font-bold tracking-[0.2em] text-ink-soft mt-1">CLASS DASHBOARD</span>
          </span>
        </div>

        <div className="px-8 py-6">
          <span className="block text-base font-bold text-ink">CS 301 — Software Engineering</span>
          <span className="block text-xs text-ink-soft mt-1">Maria Santos · BSCS-3A · Class code SE-3A26</span>
        </div>

        <div className="px-8 space-y-5 pb-6">
          {[
            { label: "ANNOUNCEMENT", w: "w-3/4" },
            { label: "ASSIGNMENT · DUE FRIDAY", w: "w-2/3" },
            { label: "MATERIAL · WEEK 4 SLIDES", w: "w-1/2" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-mint-100 text-forest-700 shrink-0">
                <Icon name="campaign" className=" text-lg" />
              </span>
              <div className="flex-1">
                <p className="text-[10px] font-extrabold tracking-[0.15em] text-ink mb-2">{row.label}</p>
                <div className="space-y-2">
                  <div className={bar("w-full")} />
                  <div className={bar(row.w)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 py-4 bg-mint-50/60 border-t border-mint-50 text-center">
          <p className="text-[10px] font-semibold text-ink-soft">CVSU Learning Management System</p>
        </div>
      </div>
    </div>
  );
}
