import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { mkdir } from "node:fs/promises";

const { UPLOAD_SECRET, FILE_UPLOAD_FOLDER_PATH, PORT } = process.env;
if (UPLOAD_SECRET === undefined || FILE_UPLOAD_FOLDER_PATH === undefined || PORT === undefined) {
  console.error(`Make sure UPLOAD_SECRET and FILE_UPLOAD_FOLDER_PATH and PORT exist in your .env file`);
  process.exit(1);
}

await mkdir(FILE_UPLOAD_FOLDER_PATH, { recursive: true });

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({
    assets: FILE_UPLOAD_FOLDER_PATH,
    prefix: "files"
  }))
  .post("/upload", async ({ body: { file }, headers: { host, authorization } }) => {
    if (authorization !== UPLOAD_SECRET) {
      throw new Error("Unauthorized");
    }

    console.log(`Got new upload request for file ${file.name}`);

    const uploadFileName = `${Bun.randomUUIDv7()}.${file.name.substring(file.name.indexOf(".") + 1)}`;
    const uploadTarget = `${FILE_UPLOAD_FOLDER_PATH}/${uploadFileName}`;
    await Bun.write(uploadTarget, file);

    return `http://${host}/files/${uploadFileName}`;
  }, {
    body: t.Object({
      file: t.File()
    }),
    headers: t.Object({
      host: t.String(),
      authorization: t.String()
    })
  })
  .listen(PORT);

console.log(
  `File server is running at ${app.server?.hostname}:${app.server?.port}`
);
