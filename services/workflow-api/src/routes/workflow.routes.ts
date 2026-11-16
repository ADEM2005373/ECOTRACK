import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';

const router = Router();

router.post('/transition', (req, res) => workflowController.transition(req, res));
router.post('/:id/transition', (req, res) => workflowController.transition(req, res));

export const workflowRouter = router;

