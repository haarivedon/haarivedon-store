import { Icon } from "@/components/icon";
import { trustStrip } from "@/lib/content/site";

export function TrustStrip() {
  return (
    <section className="border-y border-gold-600/40 bg-gold">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-y-5 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-forest/15">
        {trustStrip.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-2.5 lg:px-4"
          >
            <Icon name={item.icon} className="size-5 shrink-0 text-forest" />
            <span className="text-sm font-semibold text-forest">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
