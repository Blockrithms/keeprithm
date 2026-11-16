// 'use client';

// import { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { useSearch } from '~/context/search-context';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, ScrollArea } from '~/components/ui';
// import { useDebounce } from '~/hooks/use-debounce';
// import { useRouter } from 'next/navigation';
// import { normalizeMarkdown, truncateText } from '~/lib/utils';
// import { Search } from 'lucide-react';
// import { searchMessages } from '@/services/message';
// import { Message } from '@/types';

// export function CommandMenu() {
//   const router = useRouter();
//   const { open, setOpen } = useSearch();

//   const [query, setQuery] = useState('');

//   const debouncedQuery = useDebounce(query, 300);

//   const isValidQuery = debouncedQuery.length >= 3;

//   const {
//     data: results = [],
//     isLoading,
//     isError,
//   } = useQuery({
//     queryKey: ['search-messages', debouncedQuery],
//     queryFn: () => searchMessages(debouncedQuery),
//     enabled: isValidQuery,
//   });

//   const handleClose = () => {
//     setOpen(false);
//   };

//   const handleClick = (messageId: string) => {
//     router.push(`/workspace/message/${messageId}`);
//     setOpen(false);
//     setQuery('');
//   };

//   const queryError =
//     debouncedQuery.length > 0 && !isValidQuery ? 'Search query must be at least 3 characters long.' : null;

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Search Message</DialogTitle>
//         </DialogHeader>

//         <div className="mt-2 space-y-4">
//           <div className="relative">
//             <Input
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search..."
//               className="w-full rounded-md border-muted py-2 pl-9 pr-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
//             />

//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
//               <Search className="size-4" />
//             </span>
//           </div>

//           {queryError ? (
//             <p className="text-sm text-destructive">{queryError}</p>
//           ) : (
//             <ScrollArea className="h-48 overflow-y-auto">
//               <ul className="mt-2.5 pr-3">
//                 {isLoading ? (
//                   <li className="py-3 text-center text-sm">Searching...</li>
//                 ) : isError ? (
//                   <li className="py-3 text-center text-sm text-destructive">Failed to search messages.</li>
//                 ) : results.length > 0 ? (
//                   results.map((result: Message, index: number) => (
//                     <li
//                       key={result.id}
//                       className={`cursor-pointer rounded-md border-t border-muted px-2 py-3 text-sm transition-colors hover:bg-muted ${
//                         index === 0 ? 'border-t-0!' : ''
//                       }`}
//                       onClick={() => handleClick(result.id)}
//                     >
//                       <p>{truncateText(normalizeMarkdown(result.body), 10)}</p>
//                     </li>
//                   ))
//                 ) : debouncedQuery ? (
//                   <li className="py-3 text-center text-sm">No results found.</li>
//                 ) : null}
//               </ul>
//             </ScrollArea>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
