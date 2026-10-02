import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Bell, FolderClosed, Kanban, LayoutDashboard, Menu, MessagesSquare, X } from "lucide-react";
import socket from "../socket";


import OpenMenuUser from "@/components/OpenMenuUser";
import Loading from "@/components/Loading";
import SidebarItem from "@/components/SidebarItem";
import BoardCanvas from "@/components/BoardCanvas";
import MembersDropdown from "@/components/MemberDropdown";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import toast from "react-hot-toast";
import UserProfileCard from "@/components/UserProfileCard";
import ConversationsDalig from "@/components/ConversationsDalig";
import NotificationsDailog from "@/components/NotificationsDailog";


const API = "http://localhost:3000";
export default function BoardPage() {

    const { slug, projectId, boardId } = useParams();
    const [currentBoard, setCurrentBoard] = useState([]);
    const [openMenu, setOpenMenu] = useState(false);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openConverstionsDailog, setOpenConverstionsDailog] = useState(false);
    const [openNotificationsDailog, setOpenNotificationsDailog] = useState(false);

    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const loading = isLoading || isUserLoading;
    const [activeUsers, setActiveUsers] = useState([]);

    const getCurrentBoard = async () => {
        if (!API) return
        setIsLoading(true)
        try {
            const res = await axios.get(`${API}/workspaces/${slug}/projects/${projectId}/boards/${boardId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            setCurrentBoard(res.data);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "There is error,Try again please.")
        }
        finally {
            setIsLoading(false)
        }
    }


    useEffect(() => {
        if (!boardId || !user?._id) return;

        getCurrentBoard();

        socket.emit("joinBoard", { boardId });

        const onPresence = (activeUsers) => {
            setActiveUsers(activeUsers);
        };

        const onError = (err) => {
            toast.error(err.message)
        };

        socket.on("presence_update", onPresence);
        socket.on("error", onError);

        return () => {
            socket.emit("leaveBoard", boardId);
            socket.off("presence_update", onPresence);
            socket.off("error", onError);
        };
    }, [boardId, user?._id]);

    return (
        <div className="flex h-screen relative">
            <ConversationsDalig open={openConverstionsDailog} setOpen={setOpenConverstionsDailog} />
            <NotificationsDailog open={openNotificationsDailog} setOpen={setOpenNotificationsDailog} />
            {loading && <Loading />}
            {openMenu && (
                <div onClick={() => setOpenMenu(false)}
                    className="fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-300"
                />
            )}

            <aside
                id="sidebar"
                className={`fixed md:static z-30 top-0 left-0 h-full w-64 
                        flex flex-col justify-between p-4 space-y-6 shrink-0
                        transform ${openMenu ? "translate-x-0" : "-translate-x-full"} md:translate-x-0  
                        transition-transform duration-300 ease-in-out
                        bg-gradient-to-br from-[oklch(20%_0.03_270)] to-[oklch(14%_0.03_270)]`}>

                <div className="mb-8 ">
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] flex justify-center items-center" >
                                <Kanban />
                            </div>
                            <h1 className="text-white text-xl font-bold">WorkNest</h1>
                        </div>

                        <X color="#ffffff" onClick={() => setOpenMenu(false)} className="block md:hidden cursor-pointer" />

                    </div>
                    <ul className="flex flex-col gap-4 mt-8">
                        <Link to="/dashboard" className="text-white/80 hover:text-white">
                            <SidebarItem icon={<LayoutDashboard color="#ffffff" />} title={"Dashboard"} />
                        </Link>

                        <Link to={`/workspaces/${slug}`} className="text-white/80 hover:text-white">
                            <SidebarItem icon={<FolderClosed color="#ffffff" />} title={"My Projects"} />
                        </Link>

                        <SidebarItem icon={<MessagesSquare color="#ffffff" />} title={"Converstions"} onClick={() => setOpenConverstionsDailog(true)} />
                        <SidebarItem icon={<Bell color="#ffffff" />} title={"Notifications"} onClick={() => setOpenNotificationsDailog(true)} />


                    </ul>
                </div>

                <div className="flex justify-between items-center bg-[oklch(20%_0.03_270)] p-2 rounded-lg" onClick={() => setOpen(true)}>
                    <UserProfileCard user={user} />
                    <OpenMenuUser open={open} setOpen={setOpen} />
                </div>

            </aside>

            <div className="flex-1 flex flex-col  bg-[oklch(20%_0.03_270)]">
                <div className="flex flex-col gap-5 rounded-lg border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex justify-between items-center gap-3 w-full">

                        <div className="flex items-center gap-3 overflow-hidden">
                            <Menu color="#ffffff" className="cursor-pointer md:hidden shrink-0"
                                onClick={() => setOpenMenu(true)}
                            />

                            <div className="flex items-center gap-2 text-sm md:text-lg truncate">
                                {currentBoard?.workspace_id?.name && (
                                    <div>
                                        <span className="text-gray-400 font-medium truncate">
                                            {currentBoard?.workspace_id?.name}
                                        </span>
                                        <span className="text-gray-600">/</span>
                                    </div>
                                )}

                                {currentBoard?.project_id?.name && (
                                    <div>
                                        <span className="text-gray-400 font-medium truncate">
                                            {currentBoard?.project_id?.name}
                                        </span>
                                        <span className="text-gray-600">/</span>
                                    </div>
                                )}

                                <h1 className="text-lg md:text-xl font-semibold text-white truncate">
                                    {currentBoard?.name}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center -space-x-2 overflow-hidden">
                            {activeUsers?.map((user) => {
                                return (
                                    <div key={user?.id}>
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name}
                                                title={user.name}
                                                className="h-10 w-10 border-3 border-purple-500 rounded-full object-cover"
                                            />
                                        ) :
                                            (
                                                <div key={user?.id} className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                                    {user?.name?.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="shrink-0">
                            <MembersDropdown />
                        </div>

                    </div>

                </div>
                <main className="flex-1 p-4  overflow-x-auto w-auto "
                    style={{ backgroundColor: currentBoard.background }} >
                    <BoardCanvas />
                </main>
            </div>
        </div>
    );
}