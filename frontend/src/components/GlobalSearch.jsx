import { Search, Loader2} from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRef } from 'react';
import { useState } from 'react';


import toast from 'react-hot-toast';
import { CountCommentSearching, SearchCommentItem } from './SearchCommentItem';
import { CountCardSearching, SearchCardItem } from './SearchCardItem';

const API = "http://localhost:3000";

export default function GlobalSearch() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [results, setResults] = useState({ cards: [], comments: [] });
    const [isOpen, setIsOpen] = useState(false);

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(true);

    const searchRef = useRef(null);

    useEffect(() => {

        function handleOutClick(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutClick);
        return () => document.removeEventListener('mousedown', handleOutClick);
    }, []);

    const fetchResults = async (querySearch, numberPage, newSearch = false) => {
        if (!querySearch.trim() || !slug) return;

        try {
            setLoading(true);
            const res = await axios.get(`${API}/workspaces/${slug}/search`, {
                params: {
                    query: querySearch,
                    pageCard: numberPage,
                    pageComment: numberPage
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const newCards = res?.data?.cards;
            const newComments = res?.data?.comments;

            setResults(prev => {
                if (newSearch) {
                    return { cards: newCards, comments: newComments };
                }
                return {
                    cards: [...prev.cards, ...newCards],
                    comments: [...prev.comments, ...newComments]
                };
            });

            const totalPages = res?.data?.pagination?.cards?.totalPages || 1;

            if (numberPage >= totalPages) setHasMore(false);
            else setHasMore(true);

            setIsOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!query.trim() || !slug) {
            setResults({ cards: [], comments: [] });
            setIsOpen(false);
            setHasMore(true);
            return;
        }

        const timer = setTimeout(() => {
            setPage(1);
            setHasMore(true);
            fetchResults(query, 1, true);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, slug]);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;

        if (scrollHeight - scrollTop - clientHeight < 20 && !loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchResults(query, nextPage, false);
        }
    };

    const handleSelectResult = (item, type) => {
        setIsOpen(false);
        setQuery('');

        let projectId, boardId;

        if (type === 'card') {
            projectId = item?.project_id;
            boardId = item?.board_id?._id;
        } else if (type === 'comment') {
            projectId = item?.card_id?.project_id;
            boardId = item?.card_id?.board_id;
        }

        if (projectId && boardId) {
            navigate(`/workspaces/${slug}/projects/${projectId}/boards/${boardId}/lists`);
        }
    };

    const totalResultsCount = results?.cards?.length + results?.comments?.length;

    return (
        <div ref={searchRef} className=" relative   w-72   md:w-96" >
            <div className=" flex items-center relative   ">
                <Search className="  absolute  left-3 w-4 h-4 text-gray-400" />
             
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cards and comments..."
                    className="w-full bg-gray-800 text-gray-200 pl-9 pr-4 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                />
                {loading &&
                    <Loader2 className="absolute right-3 w-4 h-4 text-gray-400 animate-spin" />
                }
            </div>

            {isOpen && (
                <div onScroll={handleScroll} className="absolute left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {totalResultsCount === 0 && !loading ? (
                        <div className="text-gray-400 text-center p-4  text-sm ">
                            No matching results found: "{query}"
                        </div>
                    ) : (
                        <div className="divide-gray-800 divide-y ">
                            {results.cards.length > 0 && (
                                <div>
                                    <CountCardSearching count={results?.cards?.length} />
                                    {results?.cards?.map((card) => (
                                        <SearchCardItem key={card?._id} card={card} handleSelectResult={() => handleSelectResult(card, 'card')} />
                                    ))}
                                </div>
                            )}

                            {results?.comments?.length > 0 && (
                                <div>
                                    <CountCommentSearching count={results?.comments?.length} />
                                    {results?.comments?.map((comment) => (
                                        <SearchCommentItem key={comment?._id} comment={comment} handleSelectResult={() => handleSelectResult(comment, 'comment')} />
                                    ))}
                                </div>
                            )}

                            {loading && (
                                <div className=" flex items-center justify-center  gap-2 py-3   text-gray-400 text-center   text-xs ">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading more...
                                </div>
                            )}

                            {!hasMore && totalResultsCount > 0 && (
                                <div className=" text-gray-500 text-cente py-2 r text-xs ">
                                    No more results
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}