export default function CardArchiveItem({ card,handleRestoreCard }) {

    function getDateCardArchive(dateArchive) {
        if (!dateArchive) return 0

        const archiveDate = new Date(dateArchive)
        const currentDate = new Date()

        if (isNaN(archiveDate.getTime())) return 0

        const diffTime = currentDate.getTime() - archiveDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 0) return "Archived from today"
        else return `Archived from ${diffDays} days`
    }
    return (
        <div key={card?._id} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-800/70">
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">{card?.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">{card?.list_id?.name}</span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full
                                             ${card?.priority === "Low" ? " bg-teal-600" :
                                card?.priority === "Medium" ? " bg-indigo-600" :
                                    card.priority === "High" ? " bg-yellow-600" :
                                        " bg-red-600"} `}></span>
                        {card?.priority}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>
                        {getDateCardArchive(card?.deleted_at)}
                    </span>
                </div>
            </div>
            <button onClick={()=> handleRestoreCard(card?._id,card?.list_id?._id)} type="button" className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-all duration-200 hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-emerald-300">
                Restore
            </button>
        </div>
    );
}