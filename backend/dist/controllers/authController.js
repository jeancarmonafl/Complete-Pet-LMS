import { z } from 'zod';
import { login } from '../services/authService.js';
const loginSchema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(1),
    locationCode: z.string().length(2)
});
export async function loginHandler(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const result = await login(body.identifier, body.password, body.locationCode.toUpperCase());
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
        }
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}
