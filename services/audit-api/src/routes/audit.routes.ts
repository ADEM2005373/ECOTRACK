import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router();

// Route sécurisée pour les administrateurs
router.get('/logs', (req, res) => auditController.getLogs(req, res));

// Ingestion d'événements d'audit
router.post('/log', (req, res) => auditController.createLog(req, res));

// Historique par entité
router.get('/history/:entityType/:entityId', (req, res) => auditController.getEntityHistory(req, res));

export const auditRouter = router;
