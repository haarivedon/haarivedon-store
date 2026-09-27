import { Icon } from "@/components/icon";
import { trustStrip } from "@/lib/content/site";

export function TrustStrip() {
  return (
    <section className="border-y border-sage bg-sage/45">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-y-5 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-forest/10">
        {trustStrip.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-2.5 lg:px-4"
          >
            <Icon name={item.icon} className="size-5 shrink-0 text-brand-600" />
            <span className="text-sm font-medium text-forest">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
