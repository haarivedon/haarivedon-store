import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/sections/hero";
import { TrustStrip } from "@/components/sections/trust-strip";
import { About } from "@/components/sections/about";
import { Services } from "@/components/sections/services";
import { Courses } from "@/components/sections/courses";
import { PredictionBand } from "@/components/sections/prediction-band";
import { BookingBand } from "@/components/sections/booking-band";
import { Products } from "@/components/sections/products";
import { EnergyTools } from "@/components/sections/energy-tools";
import { WhyUs } from "@/components/sections/why-us";
import { Testimonials } from "@/components/sections/testimonials";
import { Blog } from "@/components/sections/blog";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <About />
        <Services />
        <Courses />
        <PredictionBand />
        <div className="bg-ivory py-6 sm:py-10">
          <BookingBand />
        </div>
        <Products />
        <EnergyTools />
        <WhyUs />
        <Testimonials />
        <Blog />
      </main>
      <SiteFooter />
    </>
  );
}
