import SidebarItem from "@/components/SidebarItem";
import OpenMenuUser from "../components/OpenMenuUser"
import NewWorkSpaceDialog from "@/components/NewWorkspaceDialog";
import CardWorkspace from "@/components/CardWorkspace";
import AddButton from "@/components/AddButton";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";


import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Kanban, LayoutDashboard, Menu, X } from "lucide-react";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import UserProfileCard from "@/components/UserProfileCard";

const API = "http://localhost:3000"



export function DashboardPage() {
    const [openMenu, setOpenMenu] = useState(false);
    const [open, setOpen] = useState(false);
    const [openWorkSpace, setOpenWorkSpace] = useState(false);


    const { data: user, isLoading: isUserLoading } = useCurrentUser();

    const fetchUserWorkspaces = async (userId) => {
        const res = await axios.get(`${API}/workspaces/WorkspaceMember/${userId}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        return res.data;
    };


    const { data: workspaces, isLoading: isWorkspaceLoading, refetch } = useQuery({
        queryKey: ['workspaces', user?._id],
        queryFn: () => fetchUserWorkspaces(user?._id),
        enabled: !!user?._id,
    });
    const isLoading = isUserLoading || isWorkspaceLoading;


    return (
        <div className="flex h-screen relative">
            {isLoading && <Loading />}
            {openMenu && (
                <div
                    onClick={() => setOpenMenu(false)}
                    className="fixed inset-0 bg-black/30 z-20 md:hidden transition-opacity duration-300"
                />
            )}
            <NewWorkSpaceDialog open={openWorkSpace} setOpen={setOpenWorkSpace} user={user} onRefreshData={refetch} />

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
                            <SidebarItem icon={<LayoutDashboard />} title={"Dashboard"} />
                        </Link>
                    </ul>
                </div>

                <div className="flex justify-between items-center bg-[oklch(20%_0.03_270)] p-2 rounded-lg" onClick={() => setOpen(true)}>
                    <UserProfileCard user={user} />
                    <OpenMenuUser open={open} setOpen={setOpen} />
                </div>

            </aside>

            <div className="flex-1 flex flex-col pb-10 bg-[oklch(20%_0.03_270)]">
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 text-white w-full">
                    <div className="flex items-center gap-3">
                        <Menu color="#ffffff" className="block md:hidden cursor-pointer w-6 h-6"
                            onClick={() => setOpenMenu(true)}
                        />
                        <span className="font-semibold text-sm md:text-base ">
                            {user?.full_name}
                        </span>
                    </div>

                    <div className="text-xs md:text-sm text-gray-400  ">
                        {user?.email}
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="flex gap-4 flex-col justify-between items-center lg:flex-row ">
                        <div className="flex flex-col gap-3">
                            <Heading title={`Welcome back,${user?.display_name || ""} `} />
                            <p className="text-gray-400">Your workspaces and recent boards.</p>
                        </div>

                        <AddButton title="New Workspace" onClick={() => setOpenWorkSpace(true)} />
                    </div>

                    <div className="mt-16">
                        <h1 className="text-white mb-6">Workspaces {user?.display_name}</h1>
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {workspaces?.map((workspace) => (
                                <CardWorkspace
                                    key={workspace?.workspace_id?._id}
                                    workspace={workspace.workspace_id}
                                />
                            ))}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}