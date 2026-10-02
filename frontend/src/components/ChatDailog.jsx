import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useEffect, useState, useRef, useCallback } from "react";
import Loading from "./Loading";
import { useParams } from "react-router";
import axios from "axios";
import { SendHorizontal } from "lucide-react";
import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import RichTextEditor from "./RichTextEditor";

export default function ChatDailog({ open, setOpen, currentUser, receiver, refreshDataCoversations, socket }) {
    const { slug } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const chatBottomRef = useRef(null);

    const getUserId = (user) => {
        if (!user) return "";
        return typeof user === "object" ? (user._id || user.id || user).toString() : user.toString();
    };

    const currentUserId = getUserId(currentUser);
    const targetReceiverId = getUserId(receiver);

    const scrollToBottom = () => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async () => {
        if (!open || !targetReceiverId || !slug) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:3000/messages/${targetReceiverId}/${slug}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setMessages(res?.data?.messages || []);

            await axios.patch(`http://localhost:3000/messages/${targetReceiverId}/${slug}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (refreshDataCoversations) {
                refreshDataCoversations();
            }
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setIsLoading(false);
        }
    }, [open, targetReceiverId, slug]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket || !targetReceiverId || !open) return;

        if (currentUserId) {
            socket.emit("join_user", currentUserId);
        }

        const handleReceiveMessage = async (newMessage) => {
            const msgSenderId = getUserId(newMessage.sender);
            const msgReceiverId = getUserId(newMessage.receiver);

            const isCurrentChat =
                (msgSenderId === targetReceiverId && msgReceiverId === currentUserId) ||
                (msgSenderId === currentUserId && msgReceiverId === targetReceiverId);

            if (isCurrentChat) {
                const isMeReceiver = msgReceiverId === currentUserId;

                const messageToAdd = {
                    ...newMessage,
                    is_read: isMeReceiver ? true : newMessage.is_read
                };

                setMessages((prev) => {
                    const exists = prev.some((m) => m._id === newMessage._id);
                    if (exists) return prev;
                    return [...prev, messageToAdd];
                });

                if (isMeReceiver) {
                    try {
                        await axios.patch(
                            `http://localhost:3000/messages/${targetReceiverId}/${slug}/read`,
                            {},
                            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                        );
                        if (refreshDataCoversations) refreshDataCoversations();
                    } catch (err) {
                        console.error("Error marking message as read:", err);
                    }
                }
            }
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [socket, targetReceiverId, currentUserId, slug, open]);

    const handleSendingMessage = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        const messageText = content;
        setContent("");

        try {
            const res = await axios.post(
                `http://localhost:3000/messages/${targetReceiverId}`,
                { slug, content: messageText },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }
            );

            if (res?.data?.message) {
                const savedMsg = res.data.message;
                setMessages((prev) => {
                    const exists = prev.some((m) => m._id === savedMsg._id);
                    if (exists) return prev;
                    return [...prev, savedMsg];
                });
                if (refreshDataCoversations) refreshDataCoversations();
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[700px] flex flex-col sm:max-w-xl bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                        Chat with <span className="text-slate-300">{receiver?.full_name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto max-h-[450px] pr-2 mt-4">
                    {isLoading && <Loading />}

                    <FieldGroup className="flex flex-col space-y-4 w-full">
                        {messages.map((message) => {
                            const senderId = getUserId(message?.sender);
                            return senderId === currentUserId ? (
                                <SenderMessage key={message._id || message.id} message={message?.content} date={message?.created_at || message.createdAt} />
                            ) : (
                                <ReceiverMessage key={message._id || message.id} message={message?.content} date={message?.created_at || message.createdAt} />
                            );
                        })}
                        <div ref={chatBottomRef} />
                    </FieldGroup>
                </div>

                <DialogFooter className="mt-4 w-full">
                    <form onSubmit={handleSendingMessage} className="w-full flex items-center gap-2">
                        <div className="flex-1 ">
                            <RichTextEditor value={content} onChange={setContent} className="min-h-[20px] max-h-24 overflow-y-auto" />
                        </div>
                        <button
                            type="submit"
                            className="h-8 w-8 mt-11 flex items-center justify-center rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                        >
                            <SendHorizontal className="w-5 h-5" />
                        </button>
                    </form>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}