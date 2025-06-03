import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/uploadthings";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
