import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

// Création d'un signalement
router.post('/', (req, res) => reportController.createReport(req, res));

// Recherche géospatiale et filtrage
router.get('/', (req, res) => reportController.getReports(req, res));

// Détail d'un signalement par son ID
router.get('/:id', (req, res) => reportController.getReportById(req, res));

export const reportRouter = router;
