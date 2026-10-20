import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

export const metadata = {
  title: "Forgot password — CVSU LMS",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6">
        <ForgotPasswordCard />
      </main>
      <Footer />
    </>
  );
}
