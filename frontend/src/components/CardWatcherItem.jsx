export default function CardWatcherItem({ name, email }) {
    return (
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-sm">
            <h1 className="ring ring-violet-600 hover:ring-2 transtion-all duration-100 border-none h-10 w-10 rounded-full bg-slate-400 flex items-center justify-center">{name?.slice(0, 2).toUpperCase()}</h1>
            <div className="text-white">
                <h1 className="text-[17px]">{name}</h1>
                <h1 className="text-[15px] text-slate-400">{email}</h1>
            </div>
        </div>
    )
}