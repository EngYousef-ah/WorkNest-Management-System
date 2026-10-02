import { useEffect, useState } from "react";
import { Check, Loader2, Send, X } from "lucide-react";
import axios from "axios";
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import MentionList from './MentionList';
import socket from "@/socket";

const API = "http://localhost:3000";

export default function CommentItem({ item, cardId, onRefresh, members = [] }) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [edit, setEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        socket.emit("join-card", cardId);

        socket.on("new-comment", (incomingComment) => {
            if (incomingComment && onRefresh) {
                onRefresh(); 
            }
        });

        return () => {
            socket.emit("leave-card", cardId);
            socket.off("new-comment");
        };
    }, [cardId, onRefresh]);


    const suggestionConfig = {
        items: async ({ query }) => {
            return members
                .filter(member => {
                    const name = member.user_id.full_name || member.display_name || member.name || member.email || '';
                    return name.toLowerCase().includes(query.toLowerCase());
                })
                .map(member => ({
                    id: member.user_id._id,
                    label: member.user_id.full_name,
                }))
                .slice(0, 5);
        },
        render: () => {
            let component;

            return {
                onStart: props => {
                    component = new ReactRenderer(MentionList, {
                        props,
                        editor: props.editor,
                    });
                    document.body.appendChild(component.element);
                    const rect = props.clientRect?.();
                    if (rect) {
                        component.element.style.position = 'absolute';
                        component.element.style.top = `${rect.bottom + window.scrollY}px`;
                        component.element.style.left = `${rect.left + window.scrollX}px`;
                        component.element.style.zIndex = '9999';
                    }
                },
                onUpdate(props) {
                    component.updateProps(props);
                    const rect = props.clientRect?.();
                    if (rect) {
                        component.element.style.top = `${rect.bottom + window.scrollY}px`;
                        component.element.style.left = `${rect.left + window.scrollX}px`;
                    }
                },
                onKeyDown(props) {
                    if (props.event.key === 'Escape') {
                        component.element.remove();
                        return true;
                    }
                    return component.ref?.onKeyDown(props);
                },
                onExit() {
                    component.element.remove();
                    component.destroy();
                },
            };
        },
    };

    function ReplyItem({ reply, cardId, onRefresh }) {
        const [editing, setEditing] = useState(false);
        const [loading, setLoading] = useState(false);

        const editReplyEditor = useEditor({
            extensions: [
                StarterKit,
                Mention.configure({
                    HTMLAttributes: { class: 'bg-violet-500/20 text-violet-300 rounded px-1 py-0.5 font-medium' },
                    suggestion: suggestionConfig,
                }),
            ],
            content: reply?.content || "",
        });

        const handleUpdate = async () => {
            if (!editReplyEditor || editReplyEditor.isEmpty) return;
            const htmlContent = editReplyEditor.getHTML();

            setLoading(true);
            try {
                await axios.put(
                    `${API}/cards/${cardId}/comments/${reply._id}`,
                    { content: htmlContent },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                if (onRefresh) await onRefresh();
                setEditing(false);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                        {reply?.authorId?.full_name || reply?.authorId?.display_name}
                    </span>
                    <span className="text-xs text-slate-400">
                        {reply?.isEdited ? "Edited" : "Sent"}
                    </span>
                </div>

                {!editing ? (
                    <div
                        onClick={() => {
                            setEditing(true);
                            editReplyEditor?.commands.setContent(reply?.content || "");
                        }}
                        className="text-xs text-slate-300 leading-relaxed break-words cursor-pointer"
                        dangerouslySetInnerHTML={{ __html: reply?.content }}
                    />
                ) : (
                    <div className="space-y-2">
                        <div className="bg-slate-900 border border-violet-500 rounded-md p-2 text-slate-300 text-xs min-h-[40px] outline-none">
                            <EditorContent editor={editReplyEditor} />
                        </div>
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <button type="button" onClick={handleUpdate} className="p-1 hover:text-white text-green-400">
                                    <Check size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="p-1 hover:text-white text-red-400"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const editCommentEditor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: { class: 'bg-violet-500/20 text-violet-300 rounded px-1 py-0.5 font-medium' },
                suggestion: suggestionConfig,
            }),
        ],
        content: item?.content || "",
    });

    const replyEditor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: { class: 'bg-violet-500/20 text-violet-300 rounded px-1 py-0.5 font-medium' },
                suggestion: suggestionConfig,
            }),
        ],
        content: "",
    });
    
    const handleSendReply = async () => {
        if (!replyEditor || replyEditor.isEmpty) return;
        const htmlContent = replyEditor.getHTML();

        try {
            setIsSubmitting(true);
            await axios.post(`${API}/cards/${cardId}/comments`,
                { content: htmlContent, parentId: item?._id },
                { headers: { Authorization: `Bearer ${ localStorage.getItem("token")}` } }
            );
            replyEditor.commands.clearContent();
            setShowReplyInput(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!editCommentEditor || editCommentEditor.isEmpty) return;
        const htmlContent = editCommentEditor.getHTML();

        setIsLoading(true);
        try {
            await axios.put(
                `${API}/cards/${cardId}/comments/${item._id}`,
                { content: htmlContent },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (onRefresh) await onRefresh();
            setEdit(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-200">
                        {item?.authorId?.full_name || item?.authorId?.display_name}
                    </span>
                    <span className="text-xs text-slate-400">
                        {item?.isEdited ? "Edited" : "Sent"}
                    </span>
                </div>

                {edit ? (
                    <div className="space-y-2">
                        <div className="bg-slate-900 border border-violet-500 rounded-md p-2 text-slate-300 text-xs min-h-[50px] outline-none">
                            <EditorContent editor={editCommentEditor} />
                        </div>
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <button type="button" onClick={handleUpdateComment} className="p-1 hover:text-white text-green-400">
                                    <Check size={18} />
                                </button>
                            )}
                            <button type="button" onClick={() => setEdit(false)} className="p-1 hover:text-white text-red-400">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-sm text-slate-300 leading-relaxed break-words cursor-pointer"
                        onClick={() => {
                            setEdit(true);
                            editCommentEditor?.commands.setContent(item?.content || "");
                        }}
                        dangerouslySetInnerHTML={{ __html: item?.content }}
                    />
                )}

                {!item?.parentId && (
                    <button
                        type="button"
                        onClick={() => setShowReplyInput(!showReplyInput)}
                        className="px-2 py-1 text-xs text-slate-300 mt-2 bg-slate-700/60 hover:bg-slate-700 rounded transition-colors"
                    >
                        {showReplyInput ? "Cancel" : "Reply"}
                    </button>
                )}

                {showReplyInput && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-2">
                        <div className="bg-slate-900 border border-slate-700 focus-within:border-violet-500 rounded-md p-2 text-slate-300 text-xs min-h-[40px]">
                            <EditorContent editor={replyEditor} />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleSendReply}
                                className="h-7 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-medium flex items-center justify-center transition-colors disabled:opacity-50 gap-1"
                            >
                                <Send size={12} /> Send
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {item?.replies && item.replies.length > 0 && (
                <div className="pl-4 space-y-2 border-l-2 border-slate-700/50 ml-2">
                    {item.replies.map((reply) => (
                        <ReplyItem
                            key={reply._id}
                            reply={reply}
                            cardId={cardId}
                            onRefresh={onRefresh}
                            members={members}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}