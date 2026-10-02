export default function ActivityLogItem({ activityLog }) {

    const renderActionContent = (actionText) => {
        if (actionText && (actionText.includes('<p>') || actionText.includes('<span'))) {
            return (
                <div
                    className="text-slate-200 font-semibold px-2 py-0.5 rounded "
                    dangerouslySetInnerHTML={{ __html: actionText }}
                />
            );
        }

        return <span className="text-slate-200 font-semibold px-2 py-0.5 rounded ">{actionText}</span>;
    };
    return (
        <div className="bg-slate-900/80 backdrop-blur-sm w-full p-4 rounded-xl hover:bg-slate-800/90 transition-all duration-200 border border-slate-700/50 hover:border-purple-500/40 shadow-lg shadow-purple-950/10 flex flex-col justify-between gap-2 text-sm text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span className="text-slate-400 font-medium">Performed by: </span>
                    <span className="text-white font-semibold">{activityLog?.user_id?.full_name}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                    {new Date(activityLog?.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}
                </span>
            </div>

            <div className="flex items-center ">
                <span className="text-slate-400">What changed:</span>

                <span className="text-slate-200 font-semibold px-2 py-0.5 rounded "> {renderActionContent(activityLog?.action)} </span>
            </div>
        </div>
    );
}