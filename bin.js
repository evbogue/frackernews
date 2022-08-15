import { listenAndServe } from "https://deno.land/std/http/server.ts"
import { serveDir } from "https://deno.land/std@0.144.0/http/file_server.ts"

await listenAndServe(":8080", (r) => {
  return serveDir(r, {fsRoot: '', showDirListing: true, quiet: true})
})

