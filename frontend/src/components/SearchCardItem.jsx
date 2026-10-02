import { FileText } from "lucide-react";

export function SearchCardItem({ card, handleSelectResult }) {
    return (
        <div key={card._id} onClick={() => handleSelectResult(card, 'card')}
            className="  cursor-pointer p-3  transition-colors duration-150 hover:bg-gray-800/70"

        >
            <div className="flex items-center gap-2 font-medium text-gray-100 text-sm ">
                <span className="truncate">{card.title}</span>
            </div>

            <div className=" flex items-center mt-1  gap-2 text-gray-400 text-xs   pl-1">
                <span className="text-blue-400 font-medium">
                    {card.board_id?.name || "Board"}
                </span>

                <span>{`--->`}</span>

                <span className=" bg-gray-800 rounded text-gray-300 px-1.5 py-0.5  ">
                    {card?.list_id?.name}
                </span>
            </div>
        </div>
    )
}

export function CountCardSearching({ count }) {
    return (
        <div className=" text-xs font-semibold text-gray-400 uppercase px-3.5 py-2 bg-gray-800/80   tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Cards ({count})
        </div>
    );

}