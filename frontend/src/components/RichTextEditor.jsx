import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function RichTextEditor({ value = "", onChange, className = "min-h-[120px]" }) {

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getText());
        },
    });

    useEffect(() => {
        if (!editor) return;

        const currentContent = editor.getText();

        if (value !== currentContent) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="text-gray-300">

            <div className="flex gap-2 p-2 rounded">

                <button type="button" className="px-2 py-1 border rounded" onClick={() =>
                    editor.chain().focus().toggleBold().run()
                }>
                    Bold
                </button>

                <button
                    type="button" className="px-2 py-1 border rounded" onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }>
                    Italic
                </button>

            </div>

            <EditorContent editor={editor}
                className={`text-[16px] border border-gray-500 rounded-md p-1 focus:outline-none ${className}`}
            />

        </div>
    );
}