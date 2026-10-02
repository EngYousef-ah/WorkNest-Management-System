export default function UserProfileCard({ user }) {
    const userName = user?.display_name;
    const prefixName = user?.display_name?.slice(0, 2).toUpperCase();
    return (
        <div className="flex justify-center items-center gap-3 pointer">
            <div className="flex justify-center items-center text-xl text-white font-semibold w-12 h-12 rounded-full overflow-hidden bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]">
                {user?.avatar_url ? <img src={user.avatar_url} alt={userName || "User Avatar"} className="w-full h-full object-cover" /> : prefixName}
            </div>
            <div className="flex flex-col text-white">
                <h1>{userName}</h1>
                <p className="text-green-400">Online</p>
            </div>
        </div>
    )
}