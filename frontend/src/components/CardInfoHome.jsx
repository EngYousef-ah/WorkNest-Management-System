import * as Icons from 'lucide-react';

export default function CardInfoHome({ icon, title, description }) {
    const SelectedIcon = Icons[icon] || Icons.HelpCircle;
    return (
        <div className="bg-[oklch(18%_0.035_270)] flex flex-col gap-4 p-6 rounded-2xl border border-white/10 hover:scale-[1.02] transition">
            <div className="w-10 h-10 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] flex justify-center items-center" >
                <SelectedIcon  />
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>

            <p className="text-sm text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}