import { ChangePasswordDialog } from "@/components/ChangePasswordDailog";
import Loading from "@/components/Loading";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';
import axios from "axios";
import { useLocation } from "react-router";
import { useCurrentUser } from "@/Hooks/useCurrentUser";

export default function UserProfilePage() {
    const [open, setOpen] = useState(false);
    const [avatar, setAvatar] = useState("");
    const fileInputRef = useRef(null);
    const [user, setUser] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const location = useLocation();
    const userExternalPage = location.state?.id;
    const { data: USER,refetch } = useCurrentUser();

    useEffect(() => {
        const targetUserId = userExternalPage || USER?._id;

        if (!targetUserId) return;

        const isOwn = !userExternalPage || userExternalPage === USER?._id;
        setIsOwnProfile(isOwn);

        setIsLoading(true);
        axios.get(`http://localhost:3000/users/${targetUserId}`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
            .then(response => {
                setUser(response.data);
                if (response.data.avatarUrl) {
                    setAvatar(response.data.avatarUrl);
                } else if (response.data.avatar_url) {
                    setAvatar(response.data.avatar_url);
                }
            })
            .catch(() => {
                console.log("There is error in fetching data user from Api");
                toast.error("Failed to load user profile");
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [userExternalPage, USER?._id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser((prevUser) => ({
            ...prevUser,
            [name]: value
        }));
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatar(previewUrl);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleSaveChanges = () => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('displayName', user.display_name || '');
        formData.append('timeZone', user.timezone || '');

        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        axios.patch(`http://localhost:3000/users/${user._id}/profile`, formData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                toast.success("Profile Updated Successfully!");
                if (response.data.user.avatar_url) {
                    setAvatar(response.data.user.avatar_url);
                }
                setAvatarFile(null);
                refetch()
            })
            .catch(err => {
                toast.error(err.response?.data?.error || "Failed to update profile");
            })
            .finally(() => setIsLoading(false));
    };

    function formatLastActive(dateString) {
        if (!dateString) return "Offline";
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "Active just now";
        const minutes = Math.floor(diff / 60);
        if (minutes < 60) return `Active ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Active ${hours} hour${hours > 1 ? "s" : ""} ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Active ${days} day${days > 1 ? "s" : ""} ago`;

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    return (
        <div className="min-h-screen bg-[oklch(0.2_0.03_270)] text-slate-100 font-sans">
            <ChangePasswordDialog open={open} setOpen={setOpen} />
            {isLoading && <Loading />}

            <div className="h-[180px] bg-gradient-to-r from-gray-950 to-slate-900 relative border-b border-slate-800">
                <div className="absolute -bottom-16 left-8 md:left-16 flex items-end gap-6">
                    <div className="w-[130px] h-[130px] rounded-full bg-slate-900 border-4 border-[oklch(0.2_0.03_270)] overflow-hidden shadow-xl flex items-center justify-center text-slate-500">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={65} className="text-slate-600" />
                        )}
                    </div>
                    <div className="mb-2">
                        <h2 className="text-2xl font-bold">{user?.full_name || ""}</h2>
                        <p className="text-sm text-slate-400">{user?.email || ""}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-24 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                    {isOwnProfile && (
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
                            <div className="flex flex-col gap-3">
                                <button onClick={triggerFileSelect} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/10">
                                    Change Avatar
                                </button>
                                <button onClick={() => setOpen(true)} className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition-colors">
                                    Change Password
                                </button>
                                <input type="file" accept="image/*" onChange={handleChange} ref={fileInputRef} className="hidden"
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/60">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Activity
                        </h3>
                        <div className="space-y-4 text-sm text-slate-400">
                            <p>
                                Last Active:{" "}
                                {isOwnProfile ?
                                    <span className="text-green-500 font-medium">🟢 Active</span> :
                                    <span className="text-slate-200 font-medium">{formatLastActive(user?.last_active_at)}</span>
                                }
                            </p>

                            <div className="flex flex-col gap-2">
                                <label className="text-slate-400 text-sm">Timezone:</label>
                                <select name="timezone" value={user?.timezone || ""} onChange={handleInputChange}
                                    disabled={!isOwnProfile} className="bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="GMT+3">GMT+3 (Asia/Riyadh)</option>
                                    <option value="UTC">UTC (Universal)</option>
                                    <option value="GMT+1">GMT+1 (Europe)</option>
                                    <option value="GMT-5">GMT-5 (New York)</option>
                                    <option value="GMT+9">GMT+9 (Japan)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isOwnProfile ? "About Me" : `${user?.full_name || 'User'}'s Profile`}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {isOwnProfile ? "Manage your public profile and personal information." : "View user profile information."}
                        </p>
                    </div>

                    <hr className="border-slate-800" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                            <input type="text" name="full_name" disabled value={user?.full_name || ""}
                                onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                            <input type="text" name="display_name" disabled={!isOwnProfile}
                                value={user?.display_name || ""} onChange={handleInputChange} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                            <input type="email" disabled value={user?.email || ""}
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed select-none"
                            />
                        </div>

                        {isOwnProfile && (
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                                <input type="password" value="••••••••••••" disabled
                                    className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed select-none"
                                />
                            </div>
                        )}
                    </div>

                    {isOwnProfile && (
                        <div className="pt-4 flex justify-end">
                            <button onClick={handleSaveChanges} className="py-2.5 px-6 bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] hover:bg-[linear-gradient(135deg,oklch(68%_0.21_277),oklch(42%_0.2_310))] text-white rounded-xl text-sm font-semibold transition-colors duration-200">
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}