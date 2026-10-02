import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();


        if (fullName.length < 3) {
            setError("The Username should contain 4 characters at least");
            return;
        }
        setError("");
        setIsLoading(true);


        axios.post("http://localhost:3000/users/register", {
            full_name: fullName,
            email: email,
            password: password
        })
            .then(() => {
                toast.success("Please check your email to verify your account!");
                navigate("/verificationEmail");
            })
            .catch((error) => {
                if (error.response) {
                    toast.error(error.response.data.message)

                } else {
                    toast.error(error.message)
                }
            })
            .finally(() => {
                setIsLoading(false);
            });

    };
    
    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden flex items-center justify-center px-4">
            {isLoading && <Loading />}


            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.25),transparent_45%)]" />

            <div className="relative z-10 w-full max-w-md">

                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <span className="text-white text-xl font-bold">||</span>
                    </div>

                    <h1 className="text-3xl font-semibold text-white">
                        Create Account
                    </h1>
                </div>

                <div className="bg-[#071028]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        <div>
                            <label className="block text-white mb-2 font-medium">
                                Full name
                            </label>

                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full h-12 rounded-xl bg-transparent border border-white/10 px-4 text-white outline-none focus:border-violet-500 transition"
                            />
                            {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
                        </div>

                        <div>
                            <label className="block text-white mb-2 font-medium">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 rounded-xl bg-transparent border border-white/10 px-4 text-white outline-none focus:border-violet-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-2 font-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-12 rounded-xl bg-transparent border border-white/10 px-4 text-white outline-none focus:border-violet-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white font-semibold hover:opacity-90 transition"
                        >
                            Create account
                        </button>

                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-gray-400 text-sm">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <p className="text-center text-gray-400 text-md mt-8">
                            Already have an account?
                            <Link to="/login">
                                <span className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text font-semibold">Sign in</span>
                            </Link>
                        </p>

                    </form>
                </div>

            </div>
        </div>
    )
}