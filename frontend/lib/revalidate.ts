import { revalidatePath } from "next/cache";

// Every change touches several pages: the list of plots (entry done or not), the list of entries
// and the result. Refreshing everything is simpler than tracking each path.
export function revalidateAllPages(): void {
  revalidatePath("/", "layout");
}
