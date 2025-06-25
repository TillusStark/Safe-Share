
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function validateAuth(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader && req.headers.get('host') !== 'localhost:54321') {
    console.error("Missing authorization header");
    return false;
  }
  
  return true;
}

export function createUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({ 
    code: 401, 
    message: "Missing authorization header" 
  }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
