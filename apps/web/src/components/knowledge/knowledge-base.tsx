import { AddItemForm } from "@/components/knowledge/add-item-form";
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
        <AddItemForm />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="gap-1.5">
          Items
          {items.data && (
            <span className="text-muted-foreground tabular-nums">{items.data.length}</span>
          )}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <ItemList />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
