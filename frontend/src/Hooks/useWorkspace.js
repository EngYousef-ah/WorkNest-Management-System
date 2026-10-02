import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "react-router";


export const useWorkspace = () => {

    const { slug } = useParams();

    const getWorkspace = async () => {
        const res = await axios.get(`http://localhost:3000/workspaces/${slug}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        return res?.data;
    }

    return useQuery({
        queryKey: ["workspace", slug],
        queryFn: getWorkspace,
        enabled: !!slug,
        staleTime: 5 * 60 * 1000
    });
}