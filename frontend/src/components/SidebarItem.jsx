
export default function SidebarItem({ icon, title,onClick  }) {
    return (
        <li onClick={onClick } className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/20 cursor-pointer transition">
            {icon}
            <span className="text-gray-400">{title}</span>
        </li>
    );
}