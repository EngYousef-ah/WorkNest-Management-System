import ReactDOM from 'react-dom';
import { Draggable } from '@hello-pangea/dnd';
import { Archive, Calendar, Pencil, SquareCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState } from 'react';
import DetailsCardDailog from './DetailsCardDailog';
import { useCurrentUser } from '@/Hooks/useCurrentUser';
import { useCurrentUserRoleInWorkspace } from '@/Hooks/useCurrentUserRoleInWorkspace';


export default function BoardCard({ card, index, handleEditCard, handleArchiveCard }) {

  const [openDetailsCardDailog, setOpenDetailsCardDailog] = useState(false)

  const { data: user } = useCurrentUser();
  const { data: currentUserRoleInWorkspace } = useCurrentUserRoleInWorkspace(user?._id );

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => {
        const cardContent = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ ...provided.draggableProps.style }}
            className={`space-y-4 group relative mb-2.5 rounded-xl border p-3.5 text-sm transition-all duration-200 cursor-pointer ${snapshot.isDragging
              ? 'bg-[#2b2e4a] border-purple-500/80 shadow-2xl ring-2 ring-purple-500/30 rotate-1 scale-[1.02] z-50'
              : 'bg-[#22253b] border-slate-700/50 hover:border-purple-500/40 hover:bg-[#282b45] shadow-xs'
              }`}
          >
            <DetailsCardDailog open={openDetailsCardDailog} setOpen={setOpenDetailsCardDailog} card={card} />

            <div className="pt-3 font-medium text-slate-100 group-hover:text-purple-200 transition-colors relative">
              {card.title}

              <div className={`bg-gray-500 absolute -top-1 right-0 p-1 rounded text-[12px] 
                ${card.priority === "Low" ? "text-emerald-900 bg-teal-200" :
                  card.priority === "Medium" ? "text-indigo-900 bg-indigo-300" :
                    card.priority === "High" ? "text-yellow-900 bg-yellow-100" :
                      "text-red-900 bg-red-300"}`}>

                <p>{card.priority}</p>

              </div>
            </div>

            {card.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {card.description}
              </p>
            )}


            <div className='flex gap-2 items-center'>
              <Calendar size={20} color='#fff' />
              <p className='text-gray-300'>{new Date(card.due_date).toLocaleDateString("en-GB")}</p>
            </div>


            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className="flex items-center -space-x-1 overflow-hidden">
                  {card?.assignments?.map((cardAssignment) => (
                    <Avatar key={cardAssignment?._id} className="inline-block border-2 border-background">
                      <AvatarImage
                        src={cardAssignment?.avatar_url}
                        alt="@shadcn"
                        className="grayscale"
                      />
                      {!cardAssignment?.avatar_url &&
                        <AvatarFallback>{cardAssignment?.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      }
                    </Avatar>
                  ))}

                </div>

                <div className='text-slate-500 ms-3 text-sm shrink-0'>
                  {card?.assignments?.length > 4 ? `${card?.assignments?.length - 4} other members` : ``}
                </div>
              </div>
            </div>


            <div className='flex flex-wrap gap-2'>
              {card?.labels?.map((cardLabel) => {
                return (
                  <div key={cardLabel._id} className='text-white rounded-sm px-4 py-1'
                    style={{ backgroundColor: cardLabel.color }} >
                    {cardLabel.name}
                  </div>
                );
              })}
            </div>

            <div className='flex gap-1 items-center'>
              <SquareCheck color="#0de358" size={26} />
              <h1 className='text-slate-300 text-[15px]'>{card?.checklistItems?.completed} / {card?.checklistItems?.total} items complete</h1>

            </div>

            <div className='flex items-center justify-between gap-3'>
              <button onClick={() => setOpenDetailsCardDailog(true)} className='bg-slate-400 text-slate-900 font-semibold px-3 py-1 rounded'>
                Details
              </button>
              <div className='flex items-center justify-end gap-3'>
                <Pencil size={20} color='#aaaaaaff' className='cursor-pointer' onClick={() => {
                  handleEditCard(true)
                }} />
                {currentUserRoleInWorkspace !== "Member" &&
                  (<Archive size={20} color="#ff0a0a" className='cursor-pointer' onClick={() => handleArchiveCard(true)} />)
                }
              </div>

            </div>
          </div>
        );

        if (snapshot.isDragging) {
          return ReactDOM.createPortal(cardContent, document.body);
        }

        return cardContent;
      }}
    </Draggable>
  );
}