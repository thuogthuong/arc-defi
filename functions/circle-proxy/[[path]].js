export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)

  // /circle-proxy/v1/... → https://api.circle.com/v1/...
  const targetPath = url.pathname.replace('/circle-proxy', '')
  const targetUrl  = `https://api.circle.com${targetPath}${url.search}`

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  // Forward request, strip x-user-agent (causes CORS failure)
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('x-user-agent')

  const response = await fetch(targetUrl, {
    method:  request.method,
    headers,
    body:    ['GET','HEAD'].includes(request.method) ? undefined : request.body,
  })

  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', '*')

  return new Response(response.body, {
    status:  response.status,
    headers: newHeaders,
  })
}
