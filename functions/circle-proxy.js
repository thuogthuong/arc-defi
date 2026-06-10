export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  
  // Rewrite path: /circle-proxy/v1/... → https://api.circle.com/v1/...
  const targetPath = url.pathname.replace('/circle-proxy', '')
  const targetUrl  = `https://api.circle.com${targetPath}${url.search}`

  // Forward request with original headers minus host
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('x-user-agent') // this header causes CORS error

  const response = await fetch(targetUrl, {
    method:  request.method,
    headers,
    body:    request.method !== 'GET' ? request.body : undefined,
  })

  // Add CORS headers to response
  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', '*')
  newHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  newHeaders.set('Access-Control-Allow-Headers', '*')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: newHeaders })
  }

  return new Response(response.body, {
    status:  response.status,
    headers: newHeaders,
  })
}
