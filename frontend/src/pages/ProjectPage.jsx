import { useEffect, useState } from "react";
import axios from "axios";
import { Bell, FolderClosed, Kanban, LayoutDashboard, Menu, MessagesSquare, Plus, X } from "lucide-react";
import { Link, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import { useBoardsUser } from "@/Hooks/useBoardsUser";
import OpenMenuUser from "@/components/OpenMenuUser";
import Loading from "@/components/Loading";
import SidebarItem from "@/components/SidebarItem";
import AddBoardDailog from "@/components/AddBoardDailog";
import BoardItem from "@/components/BoardItem";
import NotificationsDailog from "@/components/NotificationsDailog";
import ConversationsDalig from "@/components/ConversationsDalig";
import UserProfileCard from "@/components/UserProfileCard";
import MembersDropdown from "@/components/MemberDropdown";

const API = "http://localhost:3000";

export default function ProjectPage() {

    const { slug } = useParams();
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(false);
    const [open, setOpen] = useState(false);
    const [openNewBoard, setOpenNewBoard] = useState(false);
    const currentProject = location.state?.projectData;
    const [currentWorkspace, setCurrentWorkspace] = useState([]);
    const role = location.state?.role
    const [openConverstionsDailog, setOpenConverstionsDailog] = useState(false);
    const [openNotificationsDailog, setOpenNotificationsDailog] = useState(false);

    const { data: user, isLoading: userIsLoading } = useCurrentUser();
    const { data: boardUser, isLoading: boardIsLoading, refetch: reftchBoard } = useBoardsUser(currentProject?._id)
    const [isArchiving, setIsArchiving] = useState(false);
    const isLoading = userIsLoading || boardIsLoading || isArchiving;


    useEffect(() => {
        if (!slug ) return;
        try {
            axios.get(`${API}/workspaces/${slug}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
                .then((res) => setCurrentWorkspace(res.data))
                .catch(() => console.log("There is error,Try again please."))

        }
        catch (err) {
            console.log(err?.response?.data?.message || "There is error in fetching data workspace");
        }

    }, [slug])


    const handleArchiveBoard = async (e, boardId) => {
        e.stopPropagation();
        e.preventDefault();
        setIsArchiving(true);
        try {
            const res = await axios.delete(`http://localhost:3000/workspaces/${slug}/projects/${currentProject._id}/boards/${boardId}/archive`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )

            if (reftchBoard)
                reftchBoard();
            toast.success(res.data.message);


        }
        catch (err) {
            toast.error(err.response?.data?.message);
        }
        finally {
            setIsArchiving(false);
        }

    }

    return (
        <div className="flex h-screen relative">

            <AddBoardDailog open={openNewBoard} setOpen={setOpenNewBoard} projectId={currentProject?._id} onRefresh={reftchBoard} />
            <ConversationsDalig open={openConverstionsDailog} setOpen={setOpenConverstionsDailog} />
            <NotificationsDailog open={openNotificationsDailog} setOpen={setOpenNotificationsDailog} />
            {(isLoading) && <Loading />}
            {openMenu && (
                <div
                    onClick={() => setOpenMenu(false)}
                    className="fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-300"
                />
            )}

            <aside
                id="sidebar"
                className={`fixed md:static z-30 top-0 left-0 h-full w-64 
                        flex flex-col justify-between p-4 space-y-6
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

            <div className="flex-1 flex flex-col pb-10 bg-[oklch(20%_0.03_270)]">
                <div className="flex flex-col gap-5 rounded-lg border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                            <Menu color="#ffffff" onClick={() => setOpenMenu(true)}
                                className="block cursor-pointer md:hidden shrink-0 w-6 h-6"
                            />

                            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm min-w-0 flex-1 truncate">
                                {currentWorkspace?.name && (
                                    <div className="flex items-center gap-1.5 shrink-0 max-w-[120px] md:max-w-[200px] truncate">
                                        <span className="text-gray-400 font-medium truncate">
                                            {currentWorkspace.name}
                                        </span>
                                        <span className="text-gray-600">/</span>
                                    </div>
                                )}

                                {currentProject?.name && (
                                    <h1 className="text-sm md:text-xl font-semibold text-white truncate min-w-0 flex-1">
                                        {currentProject.name}
                                    </h1>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center shrink-0">
                            <MembersDropdown />
                        </div>
                    </div>
                </div>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-col gap-3 ">
                        <div className="flex gap-4 flex-col justify-between items-center lg:flex-row ">
                            {(role === "Owner" || role === "Admin") && (
                                <div className="inline-flex gap-3 px-4 py-2 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]" onClick={() => setOpenNewBoard(true)} >
                                    <Plus color="#ffffff" />
                                    <button className="text-white" >New Board </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {boardUser?.map((board) => {
                            return (
                                <Link key={board?._id}
                                    to={`/workspaces/${slug}/projects/${currentProject?._id}/boards/${board?._id}/lists`}
                                >
                                    <BoardItem
                                        name={board?.name}
                                        background={board?.background}
                                        onArchive={(e) => handleArchiveBoard(e, board?._id)}
                                    />
                                </Link>
                            )

                        })}

                    </div>
                </main>
            </div >
        </div >
    );
}