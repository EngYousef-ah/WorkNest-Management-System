import { useEffect, useMemo, useState } from "react"
import ColumnContainer from "./ColumnContainer";
import TaskCard from "./TaskCard";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import axios from "axios";
import { useParams } from "react-router";

export default function KanbanBoard() {

    const [columns, setColumns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [activeColumn, setActiveColumn] = useState(null)
    const [activeTask, setActiveTask] = useState(null)

    const { slug, projectId, boardId } = useParams();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const [lists, setLists] = useState([]);

    const getAllLists = async () => {
        const res = await axios.get(`http://localhost:3000/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        )
        setLists(res.data)
    }

    useEffect(() => {
        getAllLists()
    }, [slug, projectId, boardId])

    return (
        <div className= "  flex p-3  items-center justify-center  overflow-y-hidden " >
        <DndContext sensors={ sensors } onDragStart = { onDragStart } onDragEnd = { onDragEnd } onDragOver = { onDragOver } >
            <div className=" flex gap-4" >

                <div className="flex gap-4" >

                    <SortableContext items={ columnsId }>
                    {
                        columns.map((col) => (
                            // <div key={col.id}>{col.title}</div>
                            <ColumnContainer
                                    key= { col.id }
                                    column = { col }
                                    deleteColumn = { deleteColumn }
                                    updateColumn = { updateColumn }
                                    createTask = { createTask }
                                    tasks = { tasks.filter((task) => task.columnId === col.id) }
                                    deleteTask = { deleteTask } />
                            ))
                    }
                        </SortableContext>

                        </div>

                        < button onClick = {() => {
        createNewColumn();
    }
} className = "h-[60px] w-[350px] min-w-[350px] text-white cursor-pointer rounded-lg bg-gray-900 border-2 border-gray-950 p-4 ring-rose-500 hover:ring-2" >
    Add Column

        </button>
        </div>
{
    createPortal(
        <DragOverlay>
        { activeColumn && <ColumnContainer
                            column={ activeColumn }
                            deleteColumn = { deleteColumn }
                            updateColumn = { updateColumn }
                            createTask = { createTask }
                            deleteTask = { deleteTask }
                            tasks = {
            tasks.filter(
                (task) => task.columnId === activeColumn.id
            )
        }
        />}
{
    activeTask && <TaskCard task={ activeTask } deleteTask = { deleteTask } />
                        }
</DragOverlay>,
document.body
                )}

</DndContext >
    </div >
    )

function onDragOver(event) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;


    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task"

    if (!isActiveATask) return;


    if (isActiveATask && isOverATask) {
        setTasks(tasks => {
            const activeIndex = tasks.findIndex((t) => t.id === activeId)
            const overIndex = tasks.findIndex((t) => t.id === overId)
            tasks[activeIndex].columnId = tasks[overIndex].columnId
            return arrayMove(tasks, activeIndex, overIndex)
        })
    }

    const isOverAColumn = over.data.current?.type === "Column";

    if (isActiveATask && isOverAColumn) {
        setTasks((tasks) => {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);

            tasks[activeIndex].columnId = overId;

            return arrayMove(tasks, activeIndex, activeIndex)
        })
    }





}


function createNewColumn() {
    const columnToAdd = {
        id: generateId(),
        title: `Column ${columns.length + 1}`
    };
    setColumns([...columns, columnToAdd])
}

function generateId() {
    return Math.floor(Math.random() * 10001)
}

function deleteColumn(id) {
    const filteredColumns = columns.filter((col) => col.id !== id);
    setColumns(filteredColumns)

    const newTasks = tasks.filter((t) => t.columnId !== id);
    setTasks(newTasks)
}

function updateColumn(id, title) {
    const newColumn = columns.map(col => {
        if (col.id !== id) return col;
        return { ...col, title }
    })
    setColumns(newColumn)
}
function onDragStart(event) {
    if (event.active.data.current?.type === "Column") {
        setActiveColumn(event.active.data.current.column);
        return;
    }

    if (event.active.data.current?.type === "Task") {
        setActiveTask(event.active.data.current.task);
        return;
    }
}

function onDragEnd(event) {
    setActiveColumn(null);
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeColumnId = active.id;
    const overColumnId = over.id;

    if (activeColumnId === overColumnId) return;

    setColumns((columns) => {
        const activeColumnIndex = columns.findIndex(
            (col) => col.id === activeColumnId
        );

        const overColumnIndex = columns.findIndex(
            (col) => col.id === overColumnId
        );

        return arrayMove(columns, activeColumnIndex, overColumnIndex);
    })

}

function createTask(columnId) {
    const newTask = {
        id: generateId(),
        columnId,
        content: `Task ${tasks.length + 1}`,
    };
    setTasks([...tasks, newTask])
}

function deleteTask(taskId) {
    const newTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(newTasks)
}
}