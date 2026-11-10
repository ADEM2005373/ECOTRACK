/**
 * ECOTRACK V2 - Routes HTTP Signalements (SCRUM-49 / ECO-23)
 * En attente de l'implémentation complète par Sara Sahih.
 */

import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

// Routes réservées pour SCRUM-49 (Sara Sahih)
router.post('/', (req, res) => reportController.createReport(req, res));
router.get('/', (req, res) => reportController.getReports(req, res));
router.get('/:id', (req, res) => reportController.getReportById(req, res));

export const reportRouter = router;
