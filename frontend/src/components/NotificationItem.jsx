import { Eye } from "lucide-react";

export default function NotificationItem({ content, read, handleReadNotification }) {
    return (
        <div className={`group flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${read
            ? "bg-slate-900/60 border-slate-800/80 text-slate-400"
            : "bg-slate-900 border-indigo-500/30 shadow-lg shadow-indigo-500/5 text-slate-100"
            }`}>
            <p className="text-sm font-medium leading-relaxed">
                {content}
            </p>

            {!read && (
                <button type="button" onClick={handleReadNotification}
                    className="flex items-center justify-center p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all duration-200 hover:scale-105 shrink-0 cursor-pointer">
                    <Eye size={18} />
                </button>
            )}
        </div>
    )
}