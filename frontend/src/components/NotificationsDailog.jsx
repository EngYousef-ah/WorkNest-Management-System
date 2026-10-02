import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import NotificationItem from "./NotificationItem";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Loading from "./Loading";
import toast from "react-hot-toast";

import { io } from "socket.io-client";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function NotificationsDailog({ open, setOpen }) {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("read");
    const [isLoading, setIsLoading] = useState(false);
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const loading = isLoading || isUserLoading;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchNotifications = async (currentPage = 1, currentFilter = "read") => {
        try {
            if (!user || !open) return;
            setIsLoading(true);

            const res = await axios.get(
                `http://localhost:3000/notifications?page=${currentPage}&filter=${currentFilter}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            setNotifications(res?.data?.notifications);
            setTotalPages(res?.data?.pagination?.totalPages || 1);
            setPage(res?.data?.pagination?.currentPage || 1);
            setIsLoading(false);
        } catch (err) {
            console.log("Error fetching notifications:", err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(page, filter);
    }, [user, open, page, filter]);


    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPage(1);
    };

    useEffect(() => {
        if (!user?._id) return;

        const socket = io('http://localhost:3000', {
            auth: { token: localStorage.getItem("token") }
        });


        socket.emit("join_user", user._id);

        socket.on("new-notification", (notification) => {
            setNotifications((prev) => [notification, ...prev]);
        });

        return () => {
            socket.off("new-notification");
            socket.disconnect();
        };
    }, [user]);

    const notificationsFiltered = useMemo(() => {
        if (filter === "read") return notifications.filter(item => item.read === true);
        if (filter === "unread") return notifications.filter(item => item.read === false);
    }, [filter, notifications]);




    const handleReadNotification = async (notificationId) => {
        setIsLoading(true)
        try {
            await axios.patch(`http://localhost:3000/notifications/${notificationId}`,
                { },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await fetchNotifications(page);
            setIsLoading(false)
        }
        catch (err) {
            setIsLoading(false)
            toast.error(err.response.data.message);
        }
    }

    const handleReadAllNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await axios.patch("http://localhost:3000/notifications/read-all",
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await fetchNotifications(page);
            toast.success(res.data.message)
            setIsLoading(false)
        }
        catch (err) {
            console.log(err);

            setIsLoading(false);
            toast.error(err?.response?.data?.message);
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-h-[700px] overflow-y-auto sm:max-w-md bg-[oklch(0.25_0.03_270)] border-slate-700/60 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                        My Notifications
                    </DialogTitle>
                </DialogHeader>
                {loading && <Loading />}

                <div className="bg-gray-800 flex items-center justify-between text-sm px-3 py-2 rounded-lg border border-slate-700">
                    <button
                        onClick={() => handleFilterChange("read")}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${filter === "read"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-700/50"
                            }`}
                    >
                        Read notifications
                    </button>

                    <button
                        onClick={() => handleFilterChange("unread")}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${filter === "unread"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-700/50"
                            }`}
                    >
                        Unread notifications
                    </button>
                </div>
                <FieldGroup className="">
                    <Field>
                        {notificationsFiltered.length > 0 ?
                            notificationsFiltered.map((notification) => (
                                <NotificationItem key={notification?._id} content={notification?.content} read={notification?.read} handleReadNotification={() => handleReadNotification(notification._id)} />

                            ))
                            : (<p className="text-center text-slate-400 py-6 text-sm">No notifications found.</p>)
                        }
                    </Field>


                </FieldGroup>

                <FieldGroup>
                    <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-700/60">
                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            disabled={page === 1 || loading}
                            className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-700 bg-slate-800 text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800/80 border border-slate-700">
                            <span className="text-sm font-medium text-white">{page}</span>
                            <span className="text-sm text-slate-500">/</span>
                            <span className="text-sm text-slate-400">{totalPages}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={page >= totalPages || loading}
                            className="flex items-center justify-center w-9 h-9 rounded-md border border-slate-700 bg-slate-800 text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </FieldGroup>

                <DialogFooter className="mt-6 flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}
                        className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        Cancel
                    </Button>
                    {filter !== "read" &&
                        <Button onClick={handleReadAllNotifications} type="submit"
                            className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            read all
                        </Button>
                    }

                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}