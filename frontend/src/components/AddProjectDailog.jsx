import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { useState } from "react"
import Loading from "./Loading"
import toast from "react-hot-toast";
import { useParams } from "react-router";



export default function AddProjectDailog({ open, setOpen, onRefreshData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const { slug } = useParams()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const API = "http://localhost:3000";
        const token = localStorage.getItem("token");
        try {
            const res = await axios.post(`${API}/workspaces/${slug}/projects`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            await onRefreshData();
            toast.success(res.data.message);
            setName("");
            setDescription("")
        }
        catch (err) {
            toast.error(err?.response?.data?.message);
        }
        finally {
            setIsLoading(false);
            setOpen(false);
        }
    }

    return (

        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent className="sm:max-w-sm bg-[oklch(0.4_0.03_270)]">
                <form onSubmit={handleSubmit}>
                    {isLoading && <Loading />}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">Create a Project</DialogTitle>

                    </DialogHeader>

                    <FieldGroup className="mt-5">
                        <Field>
                            <Label htmlFor="name" className="text-gray-200">Project name</Label>
                            <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="text-gray-300" />
                        </Field>
                        <Field>
                            <Label htmlFor="description" className="text-gray-200">Project description</Label>
                            <Input id="description" name="description" required value={description} onChange={(e) => setDescription(e.target.value)} className="text-gray-300" />
                        </Field>

                    </FieldGroup>
                    <DialogFooter className="mt-5">
                        <Button type="button" onClick={() => setOpen(false)}>
                            Close
                        </Button>

                        <Button type="submit" className="bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]">
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )

}