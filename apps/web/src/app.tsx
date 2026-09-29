import { Chat } from "@/components/chat/chat";
import { KnowledgeBase } from "@/components/knowledge/knowledge-base";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    // SAFETY: CSSProperties has no index signature for custom properties; --sidebar-width is a plain CSS length.
    <SidebarProvider style={{ "--sidebar-width": "35vw" } as React.CSSProperties}>
      <Sidebar>
        <SidebarHeader className="h-12 flex-row items-center border-b px-4 text-sm font-semibold">
          Turium Assignment
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
      {/* index.html pins the dark theme, and no next-themes provider is mounted. */}
      <Toaster theme="dark" />
    </SidebarProvider>
  );
}
