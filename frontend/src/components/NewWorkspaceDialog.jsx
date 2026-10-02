import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import {  useState } from "react"
import Loading from "./Loading"
import toast from "react-hot-toast";

export default function NewWorkSpaceDialog({ open, setOpen, user, onRefreshData }) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const API = "http://localhost:3000";
        try {
            const res = await axios.post(`${API}/workspaces/create`,
                { owner_id: user?._id, name },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            await onRefreshData(true);
            toast.success(res?.data?.message);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "An error occurred, please try again.")
        }
        finally {
            setIsLoading(false);
            setOpen(false);
            setName("")
        }

    };




    return (

        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent className="sm:max-w-sm bg-[oklch(0.4_0.03_270)]">
                <form onSubmit={handleSubmit}>
                    {isLoading && <Loading />}
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">Create a workspace</DialogTitle>

                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name-1" className="text-gray-200">Workspace name</Label>
                            <Input id="name-1" name="name" value={name} onChange={(e) => setName(e.target.value)} className="text-gray-300" />
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