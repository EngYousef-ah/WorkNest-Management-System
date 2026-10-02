import { Check, TriangleAlert, X } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status');

    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.25),transparent_45%)]" />

            <div className="relative z-10 w-full max-w-md">

                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <span className="text-white text-xl font-bold">||</span>
                    </div>

                    <h1 className="text-3xl font-semibold text-white">
                        Email Verification
                    </h1>
                </div>

                <div className="bg-[#071028]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">

                    {status === 'success' && (
                        <div>
                            <div className="text-green-400 text-5xl mb-4 flex justify-center">
                                <Check size={60} className="text-green-400" strokeWidth={2.25} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Verified Successfully!</h2>
                            <p className="text-gray-400 mb-8">
                                Your email has been successfully verified. You can now log in to your account.
                            </p>
                            <Link to="/login" className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white font-semibold flex items-center justify-center hover:opacity-95 transition shadow-lg shadow-violet-500/25" >
                                Login
                            </Link>
                            


                        </div>
                    )}

                    {status === 'already_verified' && (
                        <div>
                            <div className="text-red-400 text-5xl mb-4 flex justify-center">
                                <TriangleAlert size={60} className="text-yellow-400" strokeWidth={2.25} />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Already Verified</h2>
                            <p className="text-gray-400 mb-8">
                                This email address has already been verified. You can proceed to log in.
                            </p>
                            <Link to="/login" className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white font-semibold flex items-center justify-center hover:opacity-95 transition shadow-lg shadow-violet-500/25" >
                                Login
                            </Link>
                        </div>
                    )}

                    {(status === 'not_found' || status === 'invalid') && (
                        <div>
                            <div className="text-red-400 text-5xl mb-4 justify-center"><X size={60} className="text-red-400" strokeWidth={2.25} /></div>
                            <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
                            <p className="text-gray-400 mb-8">
                                Sorry, the verification link is invalid or has expired. Please register again.
                            </p>
                            <Link to="/register" className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white font-semibold flex items-center justify-center hover:opacity-95 transition shadow-lg shadow-violet-500/25">
                                Register New Account
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}