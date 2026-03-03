import type { Request, Response } from 'express';
import { identify } from '../services/identifyService.js';
import type { IdentifyInput } from '../schemas.js';

export async function identifyController(req: Request, res: Response): Promise<void> {
  const { email, phoneNumber } = req.body as IdentifyInput;

  if (!email && !phoneNumber) {
    res.status(400).json({ error: 'At least one of email or phoneNumber is required' });
    return;
  }

  try {
    const contact = await identify({ email, phoneNumber });
    res.status(200).json({ contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}