export async function handleRequest(request: Request): Promise<Response> {
  return new Response(`[stop the bus]: ${request.method}`)
}
