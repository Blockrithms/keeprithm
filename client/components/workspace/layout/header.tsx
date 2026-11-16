import { Suspense } from "react";
import { Separator } from "@radix-ui/react-separator";
import { Search } from "~/components/common/search";
import { ThemeToggle } from "~/components/common/theme-toggle";
import { SidebarTrigger } from "~/components/ui";

export const Header = () => {
  return (
    <header className="flex h-[3.7rem] shrink-0 items-center justify-between gap-3 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex shrink-0 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <div className="flex min-w-0 flex-1 justify-center">
        <Suspense
          fallback={<div className="h-9 w-64 rounded-md bg-muted/60" />}
        >
          <Search />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};
