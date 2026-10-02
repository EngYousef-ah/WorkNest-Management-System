import { Trash } from "lucide-react";

export default function AttachmentItem({ title, uploder, date, handleDeleteAttachmentItem }) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <h1 className="text-gray-200 text-[16px]">{title}</h1>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
                <div className="flex items-center justify-center h-5 w-5 bg-sky-500 p-4 rounded-full" >{uploder.slice(0, 2).toUpperCase()}</div>
                <h1>Uploaded by: {uploder}</h1>
                <h1>on {date}</h1>
            </div>
            <div className="bg-red-200 p-1 rounded" onClick={() => handleDeleteAttachmentItem()}>
                <Trash color="#d20f0f" />
            </div>
        </div>
    );
}