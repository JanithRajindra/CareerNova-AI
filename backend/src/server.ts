// Suppress Node.js 22+ experimental localStorage warning triggered when libraries probe browser globals
const originalEmitWarning = process.emitWarning;
(process as any).emitWarning = (warning: any, ...args: any[]) => {
  const msg = typeof warning === 'string' ? warning : warning?.message || '';
  if (msg.includes('localStorage') || msg.includes('--localstorage-file')) {
    return;
  }
  return (originalEmitWarning as any).call(process, warning, ...args);
};

import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 CareerMatch AI Backend running on http://localhost:${PORT}`);
  console.log(`✅ Production Mode: Connected to Supabase Authentication & PostgreSQL`);
  console.log(`🤖 AI Provider: ${config.ai.apiKey ? config.ai.provider : 'Local deterministic ATS heuristic engine active'}`);
  console.log(`💼 Job Provider: ${config.jobProvider.name} (Active live vacancy feeds)`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  console.log(`\n📚 API docs: http://localhost:${PORT}/api/v1\n`);
});

export default app;
