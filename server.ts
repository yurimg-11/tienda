import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Simulated Email Ticket Delivery API
  app.post('/api/send-ticket-email', (req, res) => {
    const { email, customerName, ticket } = req.body;

    if (!email || !ticket) {
      res.status(400).json({ error: 'Email y datos del ticket son requeridos' });
      return;
    }

    console.log(`[SIMULATED EMAIL] Enviando ticket ${ticket.ticketNumber} a ${email}`);

    // In a production server with SMTP/Sendgrid, this sends real email.
    // We return a structured confirmation response.
    res.json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} enviado con éxito a ${email}`,
      sentAt: new Date().toISOString(),
      recipient: email
    });
  });

  // Gemini AI Inventory & Expiration Insights
  app.post('/api/ai/inventory-insights', async (req, res) => {
    try {
      if (!ai) {
        res.status(503).json({
          error: 'La clave de API de Gemini no está configurada.',
          summary: 'Análisis de IA en pausa. Configure GEMINI_API_KEY en la configuración del sistema.',
          expiringActionPlan: ['Aplica 20% de descuento a productos con menos de 5 días de caducidad.', 'Coloca embutidos y carnes frescas al frente en estantes (sistema PEPS).'],
          restockRecommendations: ['Revisar stock de frutas y verduras diariamente.'],
          salesTip: 'Ofrece combos de verdura para caldo o ensaladas con productos próximos a caducar.'
        });
        return;
      }

      const { products, sales } = req.body;

      const prompt = `Eres un consultor experto en administración de tiendas de abarrotes, fruterías y pequeños negocios.
Analiza el siguiente estado de inventario y ventas recientes para generar recomendaciones estratégicas en formato JSON estricto.

Productos en Inventario:
${JSON.stringify(products?.slice(0, 20) || [])}

Proporciona una respuesta en idioma Español con la estructura exacta:
{
  "summary": "Resumen ejecutivo breve (2 oraciones) del estado de la tienda",
  "expiringActionPlan": ["Plan de acción 1 para productos por caducar o reducir mermas", "Plan de acción 2"],
  "restockRecommendations": ["Recomendación de reabastecimiento 1", "Recomendación 2"],
  "salesTip": "Un consejo práctico para aumentar ganancias hoy"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const jsonText = response.text || '{}';
      const parsedData = JSON.parse(jsonText);

      res.json(parsedData);
    } catch (err: any) {
      console.error('Error generating AI insights:', err);
      res.status(500).json({
        error: 'No se pudo generar el reporte de IA.',
        details: err.message
      });
    }
  });

  // Gemini AI Daily Sales Summary
  app.post('/api/ai/daily-summary', async (req, res) => {
    try {
      if (!ai) {
        res.status(503).json({
          summaryText: 'Buen rendimiento en las ventas del día. Mantén la rotación de inventario.'
        });
        return;
      }

      const { dailySales, topProducts, totalProfit, totalSales } = req.body;

      const prompt = `Como asesor financiero de tiendas, escribe un resumen motivador de 3 oraciones sobre las ventas del día en la tienda.
Ventas Totales: $${totalSales}
Ganancia Neta: $${totalProfit}
Productos estrella: ${topProducts?.join(', ') || 'Varios'}

Habla directo al comerciante en tono profesional y entusiasta en español.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        summaryText: response.text || 'Excelente jornada de ventas. Continúa monitoreando tu inventario.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor POS corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
