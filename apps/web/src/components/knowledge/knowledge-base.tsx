import { IngestForm } from "@/components/knowledge/ingest-form";
import { ItemList } from "@/components/knowledge/item-list";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useItems } from "@/lib/items";

export function KnowledgeBase() {
  const items = useItems();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <IngestForm />
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>
          Items{items.data && <span className="ml-1 tabular-nums">({items.data.length})</span>}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <ItemList />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
