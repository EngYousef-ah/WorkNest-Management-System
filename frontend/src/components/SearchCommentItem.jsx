import { MessageSquare } from "lucide-react";

export function SearchCommentItem({ comment, handleSelectResult }) {
    return (
        <div key={comment?._id} onClick={() => handleSelectResult(comment, 'comment')}
            className="p-3 cursor-pointer hover:bg-gray-800/70  transition-colors duration-150"
        >
            <div className="flex items-start gap-2 text-gray-100 text-sm ">

                <MessageSquare className="text-emerald-400  mt-0.5  w-4 h-4 shrink-0" />

                <p className="line-clamp-2 text-gray-200 font-normal">
                    "{(comment.content).replace(/<[^>]*>?/gm, '')}"
                </p>
            </div>

            <div className="flex items-center ext-xs text-gray-400 mt-1.5  gap-1.5 t pl-6">
                <span className="text-gray-400">Card:</span>

                <span className="text-emerald-400 font-medium truncate max-w-[140px]">
                    {comment?.card_id?.title || "Unknown Card"}

                </span>
                {comment?.card_id?.board_id?.name && (
                    <>
                        <span>{`--->`}</span>

                        <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                            {comment?.card_id?.board_id?.name}
                        </span>
                    </>
                )}
            </div>
        </div>
    )
}

export function CountCommentSearching({count}) {
    return (
        <div className=" font-semibold text-gray-400 uppercase px-3.5 py-2 bg-gray-800/80 text-xs   tracking-wider flex items-center gap-1.5">
            <MessageSquare className=" text-emerald-400 w-3.5 h-3.5" />
            Comments ({count})
        </div>
    );

}