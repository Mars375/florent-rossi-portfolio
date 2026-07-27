import { getDraftContent } from "../../../lib/content/repository";
import { AdminEditor } from "../AdminEditor";

export default async function AdminPage() {
  const content = await getDraftContent();
  return <AdminEditor initialContent={content} />;
}
