import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "./ui/dropdown-menu";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { Archive, X } from "lucide-react";
import { useWorkspaceMembers } from "@/Hooks/useWorkspaceMembers";
import { useCurrentUserRoleInWorkspace } from "@/Hooks/useCurrentUserRoleInWorkspace";
import { useCurrentUser } from "@/Hooks/useCurrentUser";

export default function ProjectItem({ id, project, onRefreshData }) {
    const [workspace, setWorkspace] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { slug } = useParams()
    const [membersInProject, setMembersInProject] = useState([]);
    const { data: user } = useCurrentUser();
    const { data: workspaceMembers } = useWorkspaceMembers();
    const { data: currentUserRoleInWorkspace } = useCurrentUserRoleInWorkspace(user?._id);

    //  Regarding the project report, certain details are missing.
    //  Additionally, while the owner can remove themselves from the project,
    //  the admin cannot remove them. Only the owner and the admin can add
    //  new members or change the project's status (public or private). 
    // Regular members, however, can only view the project and do not have 
    // permissions to add or delete anything.



    useEffect(() => {
        if (project?.visibility === "public") {
            setWorkspace(true);
        }
        else {
            setWorkspace(false);
        }
    }, [project])




    const handleChangeVisibility = (projectId, checked) => {
        setIsLoading(true);
        axios.patch(`http://localhost:3000/workspaces/${slug}/projects/${projectId}`, {

        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => {
                toast.success(res.data.message);
            })
            .catch(() => {
                toast.error("There is an error. Check the network.");
                setWorkspace(!checked);
            })
            .finally(() => setIsLoading(false));
    };



    const handleArchiveProject = async (projectId) => {
        setIsLoading(true);
        try {
            const res = await axios.delete(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/archive`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await onRefreshData();
            toast.success(res.data.message);
            setIsLoading(false)

        }
        catch (err) {
            toast.error(err?.response?.data?.message || "There is error ,Try again please.")
        }
        finally {
            setIsLoading(false);
        }


    }


    const handleAddMemberToProject = async (memberId, role) => {
        try {
            setIsLoading(true);
            const res = await axios.post(`http://localhost:3000/workspaces/${slug}/projects/${id}/members`,
                {
                    userId: memberId,
                    role: role
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            await getAllMembersInThisProject();

            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    };



    const getAllMembersInThisProject = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/workspaces/${slug}/projects/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setMembersInProject(res.data.allMembersInProject);
        } catch (err) {
            console.log(err.response?.data?.message);
        }
    };

    const handleDeleteMemberInProject = async (memberId) => {
        try {
            setIsLoading(true)
            const res = await axios.delete(`http://localhost:3000/workspaces/${slug}/projects/${id}/members/${memberId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            )
            await getAllMembersInThisProject();
            toast.success(res.data.message)
        }
        catch (err) {
            toast.error(err.response?.data?.message)
        }
        finally {
            setIsLoading(false)
        }

    }

    useEffect(() => {
        getAllMembersInThisProject();
    }, [id, slug])




    const filteredAvailableMembers = workspaceMembers?.filter((member) => {
        const memberId = member?.user_id?._id;

        const isInProject = membersInProject.some((pMember) => {
            const pMemberId = pMember?.user_id?._id;
            return pMemberId === memberId;
        });

        return !isInProject;
    });




    return (
        <div className="mt-7 w-full rounded-3xl border border-white/10 bg-[#111827] p-6 transition-all duration-200 hover:border-purple-600">
            {isLoading && <Loading />}
            <div className="flex items-center justify-between">
                <Link
                    to={`/workspaces/${slug}/project/${project?.name}`}
                    state={{
                        projectData: project,
                        role: currentUserRoleInWorkspace
                    }}
                >
                    <h2 className="text-2xl font-semibold text-white">{project?.name}</h2>

                </Link>
                {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                    <Archive className="text-purple-400 transition duration-75 hover:scale-110" onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleArchiveProject(id);

                    }} />
                )}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-400">
                {project?.description}
            </p>

            {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                <div className="my-6 border-t border-white/10"></div>
            )}

            {(currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Project Visibility</h3>
                        <p className="text-sm text-gray-500">Choose who can access this project.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">private</span>
                        <Switch
                            checked={workspace}
                            onCheckedChange={(checked) => {
                                setWorkspace(checked);
                                handleChangeVisibility(id, checked);
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        />
                        <span className="text-sm text-purple-400">public</span>
                    </div>

                </div>
            )}

            <div className="mt-8">
                {!workspace && (currentUserRoleInWorkspace === "Owner" || currentUserRoleInWorkspace === "Admin") && (

                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">Project Members</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">+ Add Member</Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-72" >
                                <DropdownMenuLabel>Workspace Members</DropdownMenuLabel>

                                <DropdownMenuSeparator />
                                {filteredAvailableMembers?.length === 0 &&
                                    <div className="text-[12px] text-center">There are no available members to add for this project</div>
                                }
                                {filteredAvailableMembers?.map((member) => (
                                    <DropdownMenuItem className="flex justify-between" key={member._id}>
                                        <span className="font-semibold ">{member?.user_id?.full_name}</span>
                                        <span>{member?.role}</span>
                                        <Button size="sm" variant="secondary" onClick={(e) => {
                                            handleAddMemberToProject(member?.user_id?._id, member.role)
                                            e.stopPropagation();

                                        }}> Add</Button>
                                    </DropdownMenuItem>
                                ))}

                            </DropdownMenuContent>

                        </DropdownMenu>

                    </div>
                )}

                {!workspace &&

                    <div className="flex flex-wrap gap-2">

                        {membersInProject?.map((member) => (
                            <div key={member?._id} className="flex items-center gap-3 rounded-full bg-slate-800 border border-slate-700 px-3 py-2 hover:border-purple-500 transition">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-semibold">
                                    {member?.user_id?.full_name?.charAt(0).toUpperCase()}
                                </div>

                                <span className="text-sm text-gray-100">
                                    {member?.user_id?.full_name}
                                </span>
                                {currentUserRoleInWorkspace === "Owner" &&
                                    <button className="ml-1 text-red-400 hover:text-red-500 transition" >
                                        <X size={26} onClick={() => handleDeleteMemberInProject(member?.user_id?._id)} />
                                    </button>
                                }

                            </div>
                        ))}

                    </div>
                }



            </div>


        </div >
    );
}
