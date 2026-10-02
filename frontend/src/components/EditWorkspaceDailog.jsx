import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";

import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle, } from "@/components/ui/attachment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { useEffect, useState } from "react"
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";
import { useParams } from "react-router";
import { useWorkspace } from "@/Hooks/useWorkspace";
import Loading from "./Loading";

export default function EditWorkspaceDialog({ open, setOpen }) {
    const [name, setName] = useState();
    const [description, setDescription] = useState("");
    const [logo, setLogo] = useState(null);
    const queryClient = useQueryClient();
    const { slug } = useParams();
    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace();


    useEffect(() => {
        if (open && workspace) {
            setName(workspace.name || "");
            setDescription(workspace.description || "");
            setLogo(null);
        }
    }, [open, workspace]);


    const updateWorkspace = useMutation({
        mutationFn: async (formData) => {
            const { data } = await axios.patch(`http://localhost:3000/workspaces/${slug}/edit`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspace", slug] });
            toast.success("The workspace has been updated successfully.");
            setOpen(false);
        },
        onError: () => {
            toast.error("Failed to update the workspace.");
        },
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setLogo({
            file,
            preview: URL.createObjectURL(file),
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        if (logo) {
            formData.append("logo", logo.file);
        }

        updateWorkspace.mutate(formData);
    };


    return (

        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent className="sm:max-w-sm bg-[oklch(0.4_0.03_270)]">
                <form onSubmit={handleSubmit}>
                    {isWorkspaceLoading && <Loading />}
                    <DialogHeader>
                        <DialogTitle className="mt-4 text-xl font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">Edit {workspace?.name} workspace</DialogTitle>

                    </DialogHeader>

                    <FieldGroup className="mt-5">
                        <Field>
                            <Label htmlFor="name-1" className="text-gray-200">Workspace name</Label>
                            <Input id="name-1" name="name" value={name} onChange={(e) => setName(e.target.value)} className="text-gray-300" />
                        </Field>

                        <Field>
                            <Label htmlFor="description" className="text-gray-200">Workspace Description</Label>
                            <Input id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="text-gray-300" />
                        </Field>

                        <Field >
                            <Label className="text-gray-200">Workspace Logo</Label>

                            <Attachment orientation="vertical" className="mt-2">
                                <AttachmentMedia variant="image">
                                    {logo ? (
                                        <img
                                            src={logo.preview}
                                            alt="Workspace logo"
                                            className="h-36 w-full object-cover rounded-md"
                                        />
                                    ) : workspace?.logo_url ? (
                                        <img
                                            src={workspace?.logo_url}
                                            alt={workspace?.name}
                                            className="h-36 w-full object-cover rounded-md"
                                        />
                                    ) : (
                                        <div className="flex h-36 w-full items-center justify-center rounded-md bg-zinc-800">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]">
                                                {workspace?.name ? (
                                                    <span className="text-3xl font-bold text-white">
                                                        {workspace?.name.charAt(0).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <Building2 className="w-10 h-10 text-white" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </AttachmentMedia>

                                <AttachmentContent>
                                    <AttachmentTitle>
                                        {workspace?.logo_url ? "Current Logo" : "No Logo"}
                                    </AttachmentTitle>

                                    <AttachmentDescription>
                                        {workspace?.logo_url
                                            ? "Current workspace logo"
                                            : "This workspace doesn't have a logo yet."}
                                    </AttachmentDescription>
                                </AttachmentContent>
                            </Attachment>


                            <Input
                                type="file"
                                accept="image/*"
                                className="mt-3 text-gray-300"
                                onChange={handleLogoChange}
                            />
                        </Field>

                    </FieldGroup>
                    <DialogFooter className="mt-5">
                        <Button type="button" onClick={() => setOpen(false)}>
                            Close
                        </Button>

                        <Button type="submit" disabled={updateWorkspace.isPending} className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]">
                            {updateWorkspace.isPending ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}