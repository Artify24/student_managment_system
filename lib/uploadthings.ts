import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  imageUpload: f({
    image: { maxFileSize: "8MB", maxFileCount: 6 },
  }).onUploadComplete((data) => {
    console.log("Uploaded file info:", data);
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
