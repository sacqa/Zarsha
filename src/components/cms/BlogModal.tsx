import React, { useState } from 'react';
import { X, BookOpen, Tag } from 'lucide-react';
import { BlogPost } from '../../types/ecommerce';

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

export const BlogModal: React.FC<BlogModalProps> = ({ isOpen, onClose, posts }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(posts[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#120112]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#240323] text-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#7A1870] my-8 flex flex-col h-[85vh]">
        <div className="p-5 sm:p-6 border-b border-[#661760] bg-gradient-to-r from-[#5C0E54] via-[#450B42] to-[#340732] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#240323]/60 border border-[#FFC700]/40 text-[#FFC700] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#FFE066] uppercase tracking-widest font-semibold">
                ZARIYA Style Journal &amp; Fabric Guides
              </div>
              <h2
                className="text-lg font-bold text-white mt-0.5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Pakistani Fashion, Lawn Care &amp; Styling Notes
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#E3C4DF] hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Close style journal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 grow overflow-hidden">
          <div className="md:col-span-4 border-r border-[#5E1659] overflow-y-auto p-4 bg-[#31062F] divide-y divide-[#5E1659]">
            <div className="text-xs font-semibold text-[#FFE066] uppercase tracking-wider pb-2">
              Articles ({posts.length})
            </div>
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`w-full text-left py-3 px-3 rounded-xl transition-colors block cursor-pointer ${
                  selectedPost?.id === post.id
                    ? 'bg-[#4E0C47] font-bold text-[#FFC700]'
                    : 'hover:bg-[#3A0738] text-white'
                }`}
              >
                <div className="text-xs font-bold leading-snug line-clamp-2">{post.title}</div>
                <div className="text-[11px] text-[#D8B6D5] mt-1">
                  {post.readTime} · {post.category}
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-8 overflow-y-auto p-6 sm:p-8 space-y-4">
            {selectedPost ? (
              <article className="space-y-4 max-w-2xl">
                {selectedPost.image && (
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className="w-full h-56 object-cover object-top rounded-2xl border border-[#681962]"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex items-center gap-2 text-xs text-[#FFC700] font-bold uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{selectedPost.category}</span>
                  <span className="text-[#681962]">·</span>
                  <span className="text-[#D8B6D5]">{selectedPost.publishedDate}</span>
                </div>

                <h1
                  className="text-2xl sm:text-3xl font-bold text-white leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {selectedPost.title}
                </h1>

                <div className="text-xs text-[#D8B6D5] border-b border-[#5E1659] pb-3">
                  By <strong className="text-white">{selectedPost.author}</strong>
                </div>

                <div className="text-sm text-[#E9CEE6] leading-relaxed space-y-4 whitespace-pre-line pt-2">
                  {selectedPost.content}
                </div>
              </article>
            ) : (
              <p className="text-[#D8B6D5]">Select an article to read.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
