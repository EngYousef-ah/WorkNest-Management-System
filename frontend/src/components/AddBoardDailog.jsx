import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { useState } from "react"
import Loading from "./Loading"
import toast from "react-hot-toast"
import { useParams } from "react-router"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check } from "lucide-react"

const COLORS = [
    { value: "red", bg: "#ef4444", ring: "#f87171", },
    { value: "teal", bg: "#14b8a6", ring: "#2dd4bf", },
    { value: "indigo", bg: "#6366f1", ring: "#818cf8", },
    { value: "violet", bg: "#8b5cf6", ring: "#a78bfa", },
];

export default function AddBoardDailog({ open, setOpen, projectId, onRefresh }) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState("#ef4444");

    const { slug } = useParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const selected = COLORS.find(
                (color) => color.bg === selectedColor
            );

            const res = await axios.post(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards`,
                {
                    name,
                    background: selectedColor
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            )
            await onRefresh();
            toast.success(res.data.message);
            setOpen(false);
            setName("");
            setIsLoading(false)
            setSelectedColor("#ef4444");
        }
        catch (err) {
            toast.error(err.response?.data?.message);
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className=" border-slate-700/60  shadow-2xl bg-[oklch(0.25_0.03_270)]  sm:max-w-sm ">
                <form onSubmit={handleSubmit}>

                    {isLoading && (<Loading />)}

                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-transparent bg-clip-text">
                            Create a Board
                        </DialogTitle>
                    </DialogHeader>

                    <FieldGroup className="space-y-4 mt-5  ">
                        <Field>
                            <Label htmlFor="name" className=" block text-sm text-slate-200 font-medium  mb-1.5 ">
                                Board name
                            </Label>
                            <Input id="name" required name="name" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Website Redesign" className=" text-white bg-slate-900/60 border-slate-700  placeholder:text-slate-500 focus:border-indigo-500" />
                        </Field>

                        <Field>
                            <Label className="block  mb-2 text-slate-200 font-medium text-sm ">
                                Board background color
                            </Label>

                            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex items-center gap-2.5 flex-wrap pt-1">
                                {COLORS.map((color) => {
                                    const isSelected = selectedColor === color.bg;

                                    return (
                                        <div key={color.bg} className="flex items-center justify-center relative ">
                                            <RadioGroupItem value={color.bg} id={`color-${color.bg}`} className="sr-only" />

                                            <Label htmlFor={`color-${color.bg}`} style={{ backgroundColor: color.bg }}
                                                className={` items-center justify-center w-8 h-8 rounded-full scale-110  transition-all duration-200 shadow-md   shadow-sm hover:scale-105
                                                     ${isSelected ? "ring-2 ring-offset-2 ring-offset-gray-900     " : "opacity-75 cursor-pointer  hover:opacity-100"}`}
                                                {...(isSelected && { style: { backgroundColor: color.bg, "--tw-ring-color": color.ring } })}
                                            >
                                                {isSelected && (
                                                    <Check className=" w-4  stroke-[2.5]h-4 drop-shadow-sm text-white " />
                                                )}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-6 flex gap-2">
                        <Button type="button" variant="outline" className="  text-slate-300 border-slate-700  bg-transparent hover:bg-slate-800 hover:text-white"
                            onClick={() => setOpen(false)}>
                            Cancel
                        </Button>

                        <Button type="submit" className=" font-semibold bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))] text-white hover:opacity-90 transition-opacity">
                            Create Board
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}