import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import RichTextEditor from "./RichTextEditor"
import axios from "axios"
import toast from "react-hot-toast"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { useParams } from "react-router"
import CommentItem from "./Comment"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import getSuggestionConfig from "./suggestion"
import socket from "@/socket"
import { useQueryClient } from "@tanstack/react-query"
const API = "http://localhost:3000";

export default function AddCardDailog({ open, setOpen, list, card }) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Low");
    const [date, setDate] = useState("");

    const [workspaceMembers, setWorkspaceMembers] = useState([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    const [workspaceLabels, setWorkspaceLabels] = useState([]);
    const [selectedLabelIds, setSelectedLabelIds] = useState([]);
    const [isSendingComment, setIsSendingComment] = useState(false)
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    const { slug, projectId, boardId } = useParams();
    const creatorId = card?.created_by?._id || card?.created_by;
    const [comments, setComments] = useState([]);
    const queryClient = useQueryClient();


    useEffect(() => {
        socket.emit("join-card", card?._id);

        socket.on("new-comment", (incomingComment) => {

            if (!incomingComment || !incomingComment._id || !incomingComment.content) return;

            setComments((prevComments) => {
                const list = Array.isArray(prevComments) ? prevComments : [];

                const exists = list.some(c => c && c._id === incomingComment._id);
                if (exists) {
                    return list.map(c => c._id === incomingComment._id ? incomingComment : c);
                }

                return [...list, incomingComment];
            });
        });
        return () => {
            socket.emit("leave-card", card?._id);
            socket.off("new-comment");
        };
    }, [card?._id]);

    const commentEditor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention bg-indigo-500/20 text-indigo-300 rounded px-1 py-0.5 font-medium',
                },
                suggestion: getSuggestionConfig(workspaceMembers),
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'w-full min-h-[80px] max-h-32 overflow-y-auto rounded-xl bg-slate-900 text-white border border-slate-700 p-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm',
            },
        },
    }, [workspaceMembers]);

    const getAllLablesForWorkspaces = async () => {
        try {
            const res = await axios.get(`${API}/workspaces/${slug}/labels`, { headers });
            setWorkspaceLabels(res.data);
        } catch (err) {
            console.log(err.response?.data?.message);
        }
    };

    const getAllComments = async () => {
        if (!card?._id) return;
        try {
            const res = await axios.get(`${API}/cards/${card?._id}/comments`, { headers });
            setComments(res.data);
        } catch (err) {
            console.log(err.response?.data?.message);
        }
    };

    useEffect(() => {
        if (!open) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const membersRes = await axios.get(`${API}/workspaces/${slug}/members`, { headers });
                setWorkspaceMembers(membersRes.data);

                getAllLablesForWorkspaces();

                if (card?._id) {
                    setTitle(card.title || "");
                    setDescription(card.description || "");
                    setPriority(card.priority || "Low");
                    setDate(card.due_date ? card.due_date.split("T")[0] : "");

                    const [cardRes, labelsRes] = await Promise.all([
                        axios.get(`${API}/cards/${card._id}`, { headers }),
                        axios.get(`${API}/cards/${card._id}/labels`, { headers })
                    ]);

                    const initialMemberIds = cardRes.data.cardAssignments.map(m => m.user_id?._id);
                    const initialLabelIds = labelsRes.data.cardLabels.map(l => l.card_label);

                    setSelectedMemberIds(initialMemberIds);
                    setSelectedLabelIds(initialLabelIds);
                    getAllComments();
                }
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [open, card?._id, slug]);

    const handleMemberToggle = (memberId) => {
        if (memberId === creatorId) return;
        setSelectedMemberIds(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const handleLabelToggle = (labelId) => {
        setSelectedLabelIds(prev => {
            if (prev.includes(labelId)) {
                return prev.filter(id => id !== labelId);
            } else {
                return [...prev, labelId];
            }
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!list?._id) return;

        setIsLoading(true);

        try {
            if (!card) {
                const createRes = await axios.post(
                    `${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${list._id}/cards`,
                    { title, description, priority, dueDate: date },
                    { headers }
                );
                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
                setTitle("");
                setDescription("");
                setPriority("Low");
                setDate("");
                toast.success(createRes.data.message);
            } else {
                const finalMembers = Array.from(new Set([...selectedMemberIds, creatorId])).filter(Boolean);

                await Promise.all([
                    axios.patch(
                        `${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists/${list._id}/cards/${card._id}`,
                        { title, description, priority, due_date: date },
                        { headers }
                    ),
                    axios.post(
                        `${API}/cards/${card._id}/assign-members`,
                        { members: finalMembers },
                        { headers }
                    ),
                    axios.post(
                        `${API}/cards/${card._id}/labels/card-labels`,
                        { labels: selectedLabelIds },
                        { headers }
                    )
                ]);

                queryClient.invalidateQueries({ queryKey: ['board', boardId] });
                toast.success("Card updated successfully");
            }
            setOpen(false);
        } catch (err) {
            console.error("Submit Error:", err);
            toast.error(err?.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const addNewComment = async () => {
        if (!commentEditor || commentEditor.isEmpty) return;
        setIsSendingComment(true);

        try {
            const htmlContent = commentEditor.getHTML();
            const textContent = commentEditor.getText().trim();
            if (!textContent) return;
            await axios.post(`${API}/cards/${card?._id}/comments`,
                { content: htmlContent },
                { headers }
            );
            console.log(htmlContent);


            commentEditor.commands.clearContent();
            getAllComments();

        } catch (err) {
            toast.error(err?.response?.data?.message || "There is error,Try again please.");
            setIsSendingComment(false)
        }
        finally {
            setIsSendingComment(false)
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm sm:max-w-2xl overflow-y-auto max-h-[700px] bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <form onSubmit={handleSubmit}>
                    {isLoading && <Loading />}

                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            {card ? "Edit a card" : "Create a new card"}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldGroup className="mt-4 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Title */}
                        <Field>
                            <Label htmlFor="title" className="text-slate-200 font-medium text-sm block mb-1">
                                Title:
                            </Label>
                            <Input id="title" name="title" required value={title}
                                onChange={(e) => setTitle(e.target.value)} placeholder="e.g. To Do"
                                className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </Field>

                        {/* Priority Level */}
                        <Field>
                            <Label htmlFor="priority" className="text-slate-200 font-medium text-sm block mb-1">
                                Priority Level
                            </Label>
                            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                                className="w-full h-10 rounded-md bg-slate-900 border border-slate-700 px-3 text-sm text-white outline-none cursor-pointer">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </Field>

                        {/* Assign Members */}
                        {card && (
                            <Field className="sm:col-span-2">
                                <Label className="text-slate-200 font-medium text-sm block mb-1.5">
                                    Assign Members
                                </Label>
                                <div className="bg-slate-900 border border-slate-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {workspaceMembers.length === 0 ? (
                                        <p className="text-slate-500 text-xs">No members found</p>
                                    ) : (
                                        workspaceMembers.map((member) => {
                                            const userId = member?.user_id?._id;
                                            const isCreator = userId === creatorId;
                                            const isChecked = selectedMemberIds.includes(userId) || isCreator;

                                            return (
                                                <label
                                                    key={member._id}
                                                    className={`flex items-center gap-2 text-sm p-1.5 rounded transition-colors ${isCreator
                                                        ? "opacity-60 cursor-not-allowed bg-slate-800/40"
                                                        : "cursor-pointer text-slate-200 hover:bg-slate-800"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={isCreator}
                                                        onChange={() => handleMemberToggle(userId)}
                                                    />
                                                    <span className="text-white">
                                                        {member?.user_id?.full_name}
                                                        {isCreator && <span className="text-xs text-indigo-300 ml-2">(Owner)</span>}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </Field>
                        )}

                        {/* Assign Labels */}
                        {card && (
                            <Field className="sm:col-span-2">
                                <Label className="text-slate-200 font-medium text-sm block mb-1.5">
                                    Labels
                                </Label>
                                <div className="bg-slate-900 border border-slate-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {workspaceLabels.length === 0 ? (
                                        <p className="text-slate-500 text-xs">No labels found</p>
                                    ) : (
                                        workspaceLabels.map((item) => {
                                            const isChecked = selectedLabelIds.includes(item?._id);
                                            return (
                                                <label
                                                    key={item?._id}
                                                    className="flex items-center justify-between cursor-pointer text-sm text-slate-200 hover:bg-slate-800 p-1.5 rounded transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleLabelToggle(item?._id)}
                                                        />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <span
                                                        className="w-4 h-4 rounded-full border border-white/20"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </Field>
                        )}

                        {/* Due Date */}

                        <Field>
                            <Label htmlFor="date" className="text-slate-200 font-medium text-sm block mb-1">
                                Due Date
                            </Label>
                            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)}
                                className="w-full h-10 rounded-md bg-slate-900 border border-slate-700 px-3 text-sm text-white outline-none cursor-pointer"
                            />
                        </Field>

                        {/* Description */}
                        <Field className="sm:col-span-2">
                            <Label htmlFor="description" className="text-slate-200 font-medium text-sm mb-1.5 block">
                                Description
                            </Label>
                            <RichTextEditor value={description} onChange={setDescription} />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}
                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white font-semibold hover:opacity-90 transition-opacity" >
                            {card ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>

                    <hr className="my-5 border-0 border-t border-slate-700" />

                    {card && (
                        <FieldGroup>
                            <Field>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare color="#FFFFFF" size={20} />
                                    <Label className="text-slate-200 font-medium text-sm">
                                        Comments
                                    </Label>
                                </div>
                                <div className="max-h-56  overflow-y-auto space-y-2.5 pr-1 custom-scrollbar mb-3">
                                    {comments?.map((comment) => (
                                        <CommentItem key={comment?._id} item={comment} cardId={card?._id} onRefresh={getAllComments} members={workspaceMembers} />
                                    ))}
                                </div>

                                <div className="relative">
                                    <EditorContent editor={commentEditor} />
                                    <button
                                        type="button"
                                        onClick={addNewComment}
                                        className="absolute right-2 bottom-5 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-violet-600 transition-all"
                                    >

                                        {isSendingComment ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                                    </button>
                                </div>
                            </Field>
                        </FieldGroup>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}