// GET /images/:key  — يخدم الصور من R2 (رابط عام، بدون حاجة لجعل الباكت عام)
export async function onRequestGet(context) {
  const { env, params } = context;
  const object = await env.IMAGES.get(params.key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
