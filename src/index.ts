import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { identifyRouter } from './routes/identify.js';

const app = express();

app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contact Reconciliation API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/identify', identifyRouter);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env['PORT'] ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/`);
});