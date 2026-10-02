import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "react-router";

export const useWorkspaceMembers = () => {

    const { slug } = useParams();

    const getWorkspaceMembers = async () => {
        const API = "http://localhost:3000"
        const res = await axios.get(`${API}/workspaces/${slug}/members`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        return res.data;
    }

    return useQuery({
        queryKey: ["workspaceMembers", slug],
        queryFn: getWorkspaceMembers,
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10000,
        refetchOnWindowFocus: false,
    });
}