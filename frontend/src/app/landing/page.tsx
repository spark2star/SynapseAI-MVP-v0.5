import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SecuritySection from '@/components/landing/SecuritySection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import ScrollProgressBar from '@/components/ui/ScrollProgressBar';

export default function LandingPage() {
    return (
        <main className="min-h-screen">
            {/* Scroll Progress Indicator */}
            <ScrollProgressBar />

            <HeroSection />
            <ProblemSection />
            <HowItWorksSection />
            <FeaturesSection />
            <SecuritySection />
            <CTASection />
            <Footer />
        </main>
    );
}