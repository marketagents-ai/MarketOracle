// import React from 'react';
// import { Avatar } from '../Avatar/Avatar';
// import { ResearchResult } from './ResearchResult';
// import type { ResearchData } from '../../types/research';

// interface ChatMessageProps {
//   isUser?: boolean;
//   content: string | ResearchData[];
// }

// export const ChatMessage: React.FC<ChatMessageProps> = ({ isUser = false, content }) => {
//   const messageClass = isUser 
//     ? 'ml-auto flex-row-reverse' 
//     : 'flex-row';

//   return (
//     <div className={`flex items-start gap-3 mb-4 ${messageClass}`}>
//       <Avatar isUser={isUser} />
      
//       <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
//         {typeof content === 'string' ? (
//           <div className={`rounded-lg p-3 inline-block ${
//             isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
//           }`}>
//             <p>{content}</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {content.map((result, index) => (
//               <ResearchResult key={`${result.agent_id}-${index}`} data={result} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// import React from 'react';
// import type { ResearchData } from '../types/research';
// import { ResearchResult } from './ChatMessage/ResearchResult';

// interface ChatMessageProps {
//   isUser?: boolean;
//   content: string | ResearchData | ResearchData[];
// }

// export const ChatMessage: React.FC<ChatMessageProps> = ({ isUser, content }) => {
//   const messageClass = isUser 
//     ? 'bg-blue-600 text-white ml-auto' 
//     : 'bg-gray-700 text-white';

//   // Handle string content (including error messages)
//   if (typeof content === 'string') {
//     return (
//       <div className={`max-w-[80%] rounded-lg p-3 mb-4 ${messageClass}`}>
//         <p>{content}</p>
//       </div>
//     );
//   }

//   // Handle array of research data
//   if (Array.isArray(content)) {
//     return (
//       <div className="space-y-4">
//         {content.map((item, index) => (
//           <ResearchResult key={index} data={item} />
//         ))}
//       </div>
//     );
//   }

//   // Handle single research data object
//   return <ResearchResult data={content} />;
// };



import React from 'react';
import { Avatar } from '../Avatar/Avatar';
import { ResearchResult } from './ResearchResult';
import type { ResearchData } from '../../types/research';

interface ChatMessageProps {
  isUser?: boolean;
  content: string | ResearchData[];
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ isUser = false, content }) => {
  // Handle array of research data
  if (Array.isArray(content)) {
    return (
      <div className="flex gap-3">
        <Avatar isUser={isUser} />
        <div className="flex-1">
          <ResearchResult data={content} />
        </div>
      </div>
    );
  }

  // Handle string content (user messages)
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <Avatar isUser={isUser} />
      <div className={`p-3 rounded-lg max-w-[80%] ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
      }`}>
        {content}
      </div>
    </div>
  );
};