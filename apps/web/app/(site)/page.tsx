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
import { Faq } from "@/components/sections/faq";
import { Blog } from "@/components/sections/blog";
import { features } from "@/lib/flags";

export default function Home() {
  return (
    <>
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
      <Faq />
      {features.blog && <Blog />}
    </>
  );
}
