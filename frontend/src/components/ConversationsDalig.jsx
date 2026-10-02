
import ChatDailog from "./ChatDailog"
import socket from "@/socket"
import { useWorkspaceMembers } from "@/Hooks/useWorkspaceMembers"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useParams } from "react-router"
import { useCurrentUser } from "@/Hooks/useCurrentUser"
import { FieldGroup } from "./ui/field"

import { Button } from "@/components/ui/button"
import Loading from "./Loading"
import axios from "axios"
import { MessagesSquare } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

export default function ConversationsDalig({ open, setOpen }) {
    const { slug } = useParams();
    const [openChatDailog, setOpenChatDailog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [receiverId, setReceiverId] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const { data: workspaceMembers, isLoading: isMembersLoading } = useWorkspaceMembers();
    const loading = isLoading || isUserLoading || isMembersLoading;


    const fetchUnreadCounts = useCallback(async () => {
        if (!open || !workspaceMembers || workspaceMembers.length === 0) return;

        setIsLoading(true);
        try {
            const counts = {};

            await Promise.all(
                workspaceMembers?.map(async (member) => {
                    const memberId = member?.user_id?._id;
                    if (!memberId || memberId === user?._id) return;

                    try {
                        const res = await axios.get(
                            `http://localhost:3000/messages/${memberId}/${slug}/unread`,
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem("token")}`
                                }
                            }
                        );
                        counts[memberId] = res.data.messages.length;
                    } catch (err) {
                        console.error(err?.response?.data?.message || `Failed to fetch unread messages for ${memberId}`);
                    }
                })
            );

            setUnreadCounts(counts);
        } catch (err) {
            console.error(err?.response?.data?.message || "Failed to fetch unread messages");
        } finally {
            setIsLoading(false);
        }
    }, [open, workspaceMembers, slug, user?._id]);

    const refreshDataCoversations = () => {
        fetchUnreadCounts();
    };

    useEffect(() => {
        fetchUnreadCounts();
    }, [fetchUnreadCounts]);

    useEffect(() => {
        const userId = user?._id;
        if (!userId) return;

        socket.emit("join_user", userId.toString());

        const handleNewUnreadMessage = ({ senderId }) => {
            setUnreadCounts((prev) => ({
                ...prev,
                [senderId]: (prev[senderId] || 0) + 1
            }));
        };

        socket.on("unread_count_updated", handleNewUnreadMessage);

        return () => {
            socket.off("unread_count_updated", handleNewUnreadMessage);
        };
    }, [user?._id]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[700px] overflow-y-auto sm:max-w-xl bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                {openChatDailog && receiverId && (
                    <ChatDailog open={openChatDailog} setOpen={setOpenChatDailog} currentUser={user} receiver={receiverId} refreshDataCoversations={refreshDataCoversations} socket={socket} />
                )}

                <div>
                    {loading && <Loading />}

                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text"> Team Chat              </DialogTitle>
                    </DialogHeader>
                    <h1 className="text-slate-300 text-[15px] mt-2">You can communicate with team members to share ideas. </h1>

                    <FieldGroup className="mt-6 space-y-2">
                        {workspaceMembers?.map((member) => {
                            const memberUser = member?.user_id;
                            if (memberUser._id === user?._id) return null;

                            const prefixName = memberUser.full_name?.slice(0, 2).toUpperCase();
                            const unreadCount = unreadCounts[memberUser._id] || 0;

                            return (
                                <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] rounded-full flex items-center justify-center text-white font-semibold">  {prefixName}    </div>
                                        <div>
                                            <h1 className="text-white text-[17px] font-medium">{memberUser.full_name}</h1>
                                            {unreadCount > 0 && (
                                                <span className="block text-xs font-semibold text-red-400">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}        </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="p-2 hover:bg-slate-700/50 rounded-full transition cursor-pointer"
                                        onClick={() => {
                                            setReceiverId(memberUser);
                                            setOpenChatDailog(true);

                                            setUnreadCounts((prev) => ({
                                                ...prev, [memberUser._id]: 0
                                            }));
                                        }}
                                    >
                                        <MessagesSquare color="#fff" size={22} />
                                    </button>
                                </div>
                            );
                        })}
                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Cancel
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}