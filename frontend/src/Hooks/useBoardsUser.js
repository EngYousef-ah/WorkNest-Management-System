import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "react-router";


export const useBoardsUser = (projectId) => {

    const { slug } = useParams();

    const getBoardsUser = async () => {
        const res = await axios.get(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        return res?.data;
    }

    return useQuery({
        queryKey: ["boardUser", projectId, slug],
        queryFn: getBoardsUser,
        enabled: !!projectId && !!slug,
        staleTime: 5 * 60 * 1000
    });
}