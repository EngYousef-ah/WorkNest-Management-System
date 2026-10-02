import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router";
import toast from "react-hot-toast";
import Loading from "./Loading";
import { useWorkspaceMembers } from "@/Hooks/useWorkspaceMembers";
import { Trash } from "lucide-react";
import { useCurrentUser } from "@/Hooks/useCurrentUser";

const API = "http://localhost:3000";
export default function MembersDropdown() {
    const { slug } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const { data: workspaceMembers, isLoading: isMembersLoading, refetch: refetchMembers } = useWorkspaceMembers();
    const { data: user } = useCurrentUser();

    const loading = isLoading || isMembersLoading;


    const updateRole = async (memberId, role) => {
        setIsLoading(true);
        try {
            const action = role === "Member" ? "promote" : "demote";
            const res = await axios.patch(`${API}/workspaces/${slug}/members/${memberId}/${action}`,
                {},
                { headers: { Authorization: `Bearer ${ localStorage.getItem("token")}` } }
            )
            refetchMembers();
            toast.success(res?.data?.message);
            setIsLoading(false)
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "An error occurred, please try again.")
            setIsLoading(false)
        }

    }

    const handleDeleteMemberFromWorkspace = async (memberId) => {
        setIsLoading(true)
        try {
            const res = await axios.delete(`${API}/workspaces/${slug}/members/${memberId}/remove`,
                { headers: { Authorization: `Bearer ${ localStorage.getItem("token")}` } }
            )
            refetchMembers()
            toast.success(res?.data?.message);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "There is error,try again please.");
            console.log(err?.response?.data?.message || "There is error,try again please.");
        }
        finally {
            setIsLoading(false)
        }

    }
    return (
        <DropdownMenu>
            {loading && <Loading />}

            <DropdownMenuTrigger asChild>
                <Button className="bg-gray-800 hover:bg-gray-700 text-white">
                    Members
                </Button>
            </DropdownMenuTrigger>


            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 w-72 text-white">

                {workspaceMembers?.map((member) => (
                    <div key={member._id} className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-md">
                        <div>
                            <Link to={"/profile"} key={member._id} state={{ id: member?.user_id?._id }}>

                                <p className="font-medium text-white">
                                    {member?.user_id?.full_name}
                                </p>
                            </Link>

                            <p className="text-xs text-gray-400">
                                {member.role}
                            </p>
                        </div>


                        {member.role !== "Owner" && (user?._id !== member?.user_id?._id) && (
                            <div>
                                <DropdownMenuItem
                                    className={`cursor-pointer hover:bg-gray-800 ${member.role === "Member" ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300"} `}
                                    onClick={() => {
                                        updateRole(member.user_id._id, member.role);
                                    }}
                                >
                                    {member.role === "Member" ? "Promote" : "Demote"}

                                </DropdownMenuItem>
                            </div>
                        )}
                        {member.role !== "Owner" && (user?._id !== member?.user_id?._id) && (

                            <div onClick={() => handleDeleteMemberFromWorkspace(member?.user_id?._id)}>
                                <Trash color="#d21414" />
                            </div>
                        )}
                    </div>

                ))}

            </DropdownMenuContent>

        </DropdownMenu >
    );
}