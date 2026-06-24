import { put } from "@vercel/blob";

export async function uploadAsset(file: File, workspaceId: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Uploads need BLOB_READ_WRITE_TOKEN. Configure Vercel Blob before uploading files.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put("workspaces/" + workspaceId + "/" + crypto.randomUUID() + "-" + safeName, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return { url: blob.url, pathname: blob.pathname, contentType: file.type };
}
