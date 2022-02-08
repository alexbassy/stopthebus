export async function handleRequest(request: Request): Promise<Response> {
  return new Response(`STP: request method: ${request.method}`)
}
