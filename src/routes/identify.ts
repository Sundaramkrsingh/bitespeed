import { Router } from 'express';
import { identifyController } from '../controllers/identifyController.js';

export const identifyRouter = Router();

/**
 * @swagger
 * /identify:
 *   post:
 *     summary: Identify and consolidate contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: mcfly@hillvalley.edu
 *               phoneNumber:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Consolidated contact returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contact:
 *                   type: object
 *                   properties:
 *                     primaryContatcId:
 *                       type: integer
 *                       example: 1
 *                     emails:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"]
 *                     phoneNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["123456"]
 *                     secondaryContactIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [23]
 *       400:
 *         description: At least one of email or phoneNumber is required
 *       500:
 *         description: Internal server error
 */
identifyRouter.post('/', identifyController);