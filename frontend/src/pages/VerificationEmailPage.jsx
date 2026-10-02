import { Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function VerificationEmailPage() {
    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center px-4">

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#6100c2]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="z-10 w-full max-w-md flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-[#6100c2]/10 border border-[#6100c2]/20 rounded-full animate-bounce-slow">
                    <Mail className="text-[#a855f7]" size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                        Check your email
                    </h1>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        We've sent a verification link to your email address. It should arrive within a few seconds.
                    </p>
                </div>

                <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Didn't receive the email? Check your spam folder or try resending the link.
                    </p>
                    <div className="flex gap-2">
                        <Link to="/login">
                            <button className="mt-2 py-2.5 px-4 bg-[#6100c2] hover:bg-[#5000a1] text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 group">
                                Login
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer"
                            className="w-3/4 mt-2 py-2.5 px-4 bg-[#6100c2] hover:bg-[#5000a1] text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 group">
                            Go to Inbox
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                </div>

            </div>
        </div>
    );
}