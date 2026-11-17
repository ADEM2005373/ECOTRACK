import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { resolutionController } from '../controllers/resolution.controller';
import { reopenController } from '../controllers/reopen.controller';

const router = Router();

router.post('/transition', (req, res) => workflowController.transition(req, res));
router.post('/:id/transition', (req, res) => workflowController.transition(req, res));
router.post('/:id/resolve', (req, res) => resolutionController.resolve(req, res));
router.post('/:id/reopen', (req, res) => reopenController.reopen(req, res));

export const workflowRouter = router;

