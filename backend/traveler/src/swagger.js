// src/swagger.js
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load openapi.json via fs to avoid JSON import assertions
const openapiPath = path.resolve(__dirname, 'openapi.json');
const swaggerDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));

export default function mountSwagger(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      swaggerOptions: {
        withCredentials: true, 
      },
    })
  );
}
