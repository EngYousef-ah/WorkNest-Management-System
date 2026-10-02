import Loading from "@/components/Loading";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ArrowRight, Ungroup } from "lucide-react";
import { Toast } from "radix-ui";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router";
import { useNavigate } from 'react-router-dom';

export default function AcceptingInvitationPage() {

    const { token } = useParams();
    const [checkStatus, setCheckStatus] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const hasChecked = useRef(false);
    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;
        const checkInvitation = async () => {
            try {
                setIsLoading(true);

                const decoded = jwtDecode(token);
                if (!decoded || !decoded.email) {
                    throw new Error("Invalid invitation token");
                }
                const userToken = localStorage.getItem("token");

                await axios.get(`http://localhost:3000/invitations/${token}`);


                if (userToken) {
                    try {
                        await axios.get(`http://localhost:3000/users/email/${decoded.email}`, {
                            headers: { Authorization: `Bearer ${userToken}` }
                        });
                    } catch (err) {
                        // إذا لم يكن مسجلاً الدخول، لا نعتبرها مشكلة قاتلة تمنع رؤية صفحة الدعوة، 
                        // بل يمكننا السماح له بالقبول إذا سجل دخول أو توجيهه لتسجيل الدخول.
                    }
                }

                setCheckStatus(true);

            } catch (error) {
                if (error.response?.status === 400) {
                    toast.error(error.response?.data?.message);
                    // navigate(`/login?invite=${token}`);
                    return;
                }
                else if (error.response?.status === 404) {
                    toast.error(error.response?.data?.message);
                    // navigate(`/register?invite=${token}`);
                    return;
                }
                else {
                    toast.error(error.response?.data?.message || "Invalid invitation");
                }

            } finally {
                setIsLoading(false);
            }
        };

        checkInvitation();

    }, [token, navigate]);



    const handleAcceptingInvitation =async () => {
        setIsLoading(true);
        const userToken = localStorage.getItem("token");

        if (!userToken) {
            toast.error("Please login first.");
            navigate(`/login?invite=${token}`);
            return;
        }

        try {
            setIsLoading(true);

            const res = await axios.post(
                `http://localhost:3000/invitations/${token}/accept`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            );

            toast.success(res.data.message);
            navigate("/dashboard");

        } catch (err) {
            toast.error(
                err.response?.data?.message || "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center px-4">
            {isLoading && <Loading />}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#6100c2]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="z-10 w-full max-w-md flex flex-col items-center text-center gap-6">
                <div className="p-4 bg-[#6100c2]/10 border border-[#6100c2]/20 rounded-full animate-bounce-slow">
                    <Ungroup className="text-[#a855f7]" size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                        Are you sure you want to accept this invitation to the workspace?</h1>
                </div>

                <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        If you accept the invitation, you will become a new member of this workspace.
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">You need to register if you don't have an account, then log in and accept the invitations.</p>
                    <div className="flex gap-2">
                        <Link to="/register">
                            <button target="_blank"
                                className=" mt-2 py-2.5 px-4 bg-[#6100c2] hover:bg-[#5000a1] text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 group">
                                Register
                            </button>
                        </Link>
                        <button disabled={!checkStatus} onClick={handleAcceptingInvitation} target="_blank" rel="noopener noreferrer"
                            className="w-3/4 mt-2 py-2.5 px-4 bg-[#6100c2] hover:bg-[#5000a1] text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 group">
                            Accepting the invitation
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}