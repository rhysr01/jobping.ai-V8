import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import BuiltForStudents from "@/components/sections/BuiltForStudents";
import Pricing from "@/components/sections/Pricing";
import EmailPhoneShowcase from "@/components/marketing/EmailPhoneShowcase";

export default function Page() {
  return (
    <>
      <Hero />
      <EmailPhoneShowcase />
      <HowItWorks />
      <BuiltForStudents />
      <Pricing />
    </>
  );
}