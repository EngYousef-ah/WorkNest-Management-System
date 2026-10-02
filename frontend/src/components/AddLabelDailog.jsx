import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";

import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Loading from "./Loading"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios"
import { useState } from "react"
import toast from "react-hot-toast";
import { useParams } from "react-router";
import { Trash } from "lucide-react";
import { useWorkspace } from "@/Hooks/useWorkspace";


export default function AddLabelDailog({ open, setOpen }) {
    const [nameLabel, setNameLabel] = useState("");
    const [colorLabel, setColorLabel] = useState("#000000");

    const queryClient = useQueryClient();
    const { slug } = useParams()

    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace();
    const { data: workspaceLabels = [], isLoading: isLoadingLabel } = useQuery({
        queryKey: ["labels", slug],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:3000/workspaces/${slug}/labels`, {
                headers: {
                    Authorization: `Bearer ${ localStorage.getItem("token")}`
                }
            });
            return res.data;
        }
    });
    const loading=isLoadingLabel ||isWorkspaceLoading;


    const deleteLabelMutation = useMutation({
        mutationFn: async (id) => {
            const res = await axios.delete(`http://localhost:3000/workspaces/${slug}/labels/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["labels", slug] });
            toast.success(data.message);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || err.message);
        }
    });
    const handleDeleteLabel = async (id) => {
        deleteLabelMutation.mutate(id);
    }



    const createLabelMutation = useMutation({
        mutationFn: async (newLabelData) => {
            const res = await axios.post(
                `http://localhost:3000/workspaces/${slug}/labels`,
                newLabelData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["labels", slug] });
            toast.success(data.message);
            setNameLabel("");
            setColorLabel("#000000");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to create label");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createLabelMutation.mutate({ name: nameLabel, color: colorLabel });
    };



    return (

        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent className="sm:max-w-sm bg-[oklch(0.4_0.03_270)]">
                <form onSubmit={handleSubmit}>
                    {loading && <Loading />}
                    <DialogHeader>
                        <DialogTitle className="mt-4 text-xl font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            Add Labels To {workspace?.name}
                        </DialogTitle>

                    </DialogHeader>

                    <FieldGroup className="mt-5">

                        <div className="flex flex-wrap items-center gap-3">
                            {workspaceLabels.map((label) => (
                                <span key={label._id} style={{ backgroundColor: label.color }}
                                    className="flex items-center justify-between gap-3 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:opacity-95"
                                >
                                    <span>{label.name}</span>

                                    <button type="button" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLabel(label._id);
                                    }}
                                        className="transition-transform duration-200 hover:scale-125 focus:outline-none"
                                        aria-label="Delete label"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <Field>
                            <Label htmlFor="label" className="text-gray-200">Name Label</Label>
                            <Input id="label" name="label" required value={nameLabel} onChange={(e) => setNameLabel(e.target.value)} className="text-gray-300" />
                        </Field>
                        <div className="flex items-center gap-4">
                            <input type="color" value={colorLabel} required onChange={(e) => setColorLabel(e.target.value)}
                                className="h-12 w-12 cursor-pointer rounded-lg border border-gray-300"
                            />

                            <span className="rounded-full px-4 py-2 text-white" style={{ backgroundColor: colorLabel }} >
                                Preview
                            </span>
                        </div>


                    </FieldGroup>
                    <DialogFooter className="mt-5">
                        <Button type="button" onClick={() => setOpen(false)}>
                            Close
                        </Button>

                        <Button type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]">
                            {createLabelMutation.isPending ?
                                "Creating..." : deleteLabelMutation.isPending ?
                                    "Deleting..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}