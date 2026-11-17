/**
 * ECOTRACK V2 - Routes HTTP Signalements (SCRUM-49 / ECO-23)
 * Développé par Sara Sahih
 */

import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

// Routes officielles ECO-23 (SCRUM-49)
router.post('/', (req, res) => reportController.createReport(req, res));
router.get('/', (req, res) => reportController.getReports(req, res));
router.get('/nearby', (req, res) => reportController.getReports(req, res));
router.get('/:id', (req, res) => reportController.getReportById(req, res));

export const reportRouter = router;
