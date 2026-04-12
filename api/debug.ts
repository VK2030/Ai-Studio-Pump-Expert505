export default function handler(req: any, res: any) {
  res.status(200).json({
    message: "Debug info",
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    },
    headers: req.headers
  });
}
