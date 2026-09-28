import { Chat } from "@/components/chat/chat";
import { KnowledgeBase } from "@/components/knowledge/knowledge-base";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function App() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-12 flex-row items-center px-4 text-sm font-semibold">
          Turium
        </SidebarHeader>
        <KnowledgeBase />
      </Sidebar>
      <SidebarInset className="h-svh">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">Ask</h1>
        </header>
        <Chat />
      </SidebarInset>
    </SidebarProvider>
  );
}
