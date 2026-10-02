import { Plus } from "lucide-react";

export default function AddButton({title,onClick}) {
    return (
        <div className="inline-flex gap-3 px-4 py-2 rounded-md bg-[linear-gradient(135deg,oklch(62%_0.21_277),oklch(72%_0.2_310))]" onClick={() =>  onClick(true)}>
            <Plus color="#ffffff" />
            <button className="text-white" >{title} </button>
        </div>
    );
}