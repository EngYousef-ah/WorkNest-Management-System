export default function ReceiverMessage({ message ,date}) {
    return (
        <div className="flex flex-col">
            <div className="self-end bg-purple-600/60 text-white p-3 rounded-lg max-w-xs">
                <h1>{message}</h1>
            </div>

            <div className="text-white  self-end gap-1">
                <p className="text-xs text-slate-300">{new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>

            </div>
        </div>
    )
}