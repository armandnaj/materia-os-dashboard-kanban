import { getChatGPTUser } from "../app/chatgpt-auth";

export async function canEditSite() {
  const user = await getChatGPTUser();
  if (!user) return false;

  const configured = (process.env.EDITOR_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLocaleLowerCase())
    .filter(Boolean);

  return configured.includes(user.email.toLocaleLowerCase());
}

export async function requireEditorResponse() {
  if (await canEditSite()) return null;
  return Response.json(
    { error: "Редактирование доступно только владельцу проекта" },
    { status: 403 },
  );
}
