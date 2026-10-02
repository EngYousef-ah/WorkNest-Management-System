import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Bell, Bookmark, Kanban, LayoutDashboard, Menu, MessagesSquare, Plus, Settings, X } from "lucide-react";
import OpenMenuUser from "@/components/OpenMenuUser";
import Loading from "@/components/Loading";
import SidebarItem from "@/components/SidebarItem";



import toast from "react-hot-toast";
import AddLabelDailog from "@/components/AddLabelDailog";
import MembersDropdown from "@/components/MemberDropdown";
import ProjectItem from "@/components/ProjectItem";
import AddProjectDailog from "@/components/AddProjectDailog";
import { useCurrentUser } from "@/Hooks/useCurrentUser";
import ConversationsDalig from "@/components/ConversationsDalig";
import NotificationsDailog from "@/components/NotificationsDailog";
import { useWorkspaceMembers } from "@/Hooks/useWorkspaceMembers";
import { useProjectsUser } from "@/Hooks/useProjectsUser";
import { useWorkspace } from "@/Hooks/useWorkspace";
import GlobalSearch from "@/components/GlobalSearch";
import EditWorkspaceDialog from "@/components/EditWorkspaceDailog";
import { useCurrentUserRoleInWorkspace } from "@/Hooks/useCurrentUserRoleInWorkspace";
import UserProfileCard from "@/components/UserProfileCard";



const API = "http://localhost:3000";
export default function WorkspacePage() {
    const [openMenu, setOpenMenu] = useState(false);
    const [open, setOpen] = useState(false);
    const [openEditWorkspaceDailog, setOpenEditWorkspaceDailog] = useState(false);
    const [openLabelDailog, setOpenLabelDailog] = useState(false);
    const [email, setEmail] = useState("");
    const [openNewProject, setOpenNewProject] = useState(false);
    const [openConverstionsDailog, setOpenConverstionsDailog] = useState(false);
    const [openNotificationsDailog, setOpenNotificationsDailog] = useState(false);
    const [isInvitetion, setIsInvitetion] = useState(false)
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const { data: workspaceMembers, isLoading: isMembersLoading } = useWorkspaceMembers();
    const { data: projectsUser, isLoading: isProjectsLoading, refetch: refetchProjects } = useProjectsUser();
    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace();

    const { data: currentUserRoleInWorkspace, isLoading: loadingCurrentRole } = useCurrentUserRoleInWorkspace(user?._id);


    const isLoading = isInvitetion || isUserLoading || isWorkspaceLoading || isMembersLoading || isProjectsLoading;


    const handelInviteFriend = async (e) => {
        e.preventDefault();
        if (email.length < 11) {
            toast.error("Please write the email address correctly.")
            return
        }
        try {
            setIsInvitetion(true);
            const res = await axios.post(`${API}/workspaces/${workspace.slug}/invitations`,
                { email, role: "Member" },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            toast.success(res?.data?.message);

        }
        catch (err) {
            toast.error(err?.response?.data?.message || "There is error,Try again please.");
        }
        finally {
            setIsInvitetion(false);
            setEmail("");
        }
    }



    return (
        <div className="flex h-screen relative">
            <EditWorkspaceDialog open={openEditWorkspaceDailog} setOpen={setOpenEditWorkspaceDailog} />
            <AddLabelDailog open={openLabelDailog} setOpen={setOpenLabelDailog} />
            <AddProjectDailog open={openNewProject} setOpen={setOpenNewProject} onRefreshData={refetchProjects} />
            <ConversationsDalig open={openConverstionsDailog} setOpen={setOpenConverstionsDailog} />
            <NotificationsDailog open={openNotificationsDailog} setOpen={setOpenNotificationsDailog} />
            {(isLoading || isInvitetion || loadingCurrentRole) && <Loading />}
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

                        {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                            <SidebarItem icon={<Settings color="#ffffff" />} title={"Edit Workspace"} onClick={() => setOpenEditWorkspaceDailog(true)} />
                        )}

                        {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                            <SidebarItem icon={<Bookmark color="#ffffff" />} title={"Add Labels"} onClick={() => setOpenLabelDailog(true)} />
                        )}

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
                <div className="flex flex-col gap-5 rounded-lg border border-white/10 bg-white/5 p-4 xl:flex-row xl:items-center xl:justify-between">

                    <div className="flex items-center gap-3">
                        <Menu color="#ffffff" onClick={() => setOpenMenu(true)} className="block cursor-pointer md:hidden" />
                        <div>
                            <h1 className="text-xl font-semibold text-white">{workspace?.name}</h1>
                            <p className="text-sm text-gray-400">Owner  {workspaceMembers?.length > 0 ? `and  ${workspaceMembers?.length - 1}  Members` : ""} </p>
                        </div>



                    </div>
                    <GlobalSearch />

                    <div className="flex items-center">
                        <MembersDropdown />
                    </div>

                    {(currentUserRoleInWorkspace === "Owner") && (
                        <form className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="friend@email.com" required
                                className="h-10 w-full rounded-md border border-white/10
                            bg-white/10 px-3 text-white placeholder:text-gray-400 outline-none transition focus:border-violet-500"
                            />
                            <button type="submit"
                                className="h-10 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]
                            px-6 font-medium text-white transition hover:opacity-90"
                                onClick={handelInviteFriend}>
                                Invite
                            </button>
                        </form>
                    )}

                </div>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-col gap-3 ">
                        {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                            <div className="flex gap-4 flex-col justify-between items-center lg:flex-row ">
                                <div className="inline-flex gap-3 px-4 py-2 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]" onClick={() => setOpenNewProject(true)} >
                                    <Plus color="#ffffff" />
                                    <button className="text-white" >New Project </button>
                                </div>
                            </div>
                        )}

                    </div>
                    {projectsUser?.map((project) => (
                        <ProjectItem key={project?._id} id={project?._id} project={project} onRefreshData={refetchProjects} />
                    ))}
                </main>
            </div>
        </div>
    );
}