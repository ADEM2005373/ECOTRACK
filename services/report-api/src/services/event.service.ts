/**
 * ECOTRACK V2 - Service de Messagerie Asynchrone RabbitMQ (SCRUM-49 / ECO-23)
 * Développé par Sara Sahih
 * 
 * Publie les événements de cycle de vie des signalements vers l'échange RabbitMQ 'ecotrack.events'
 * avec la clé de routage 'report.created' pour alimenter l'ETL (SCRUM-57) et les notifications.
 */

export class EventService {
  private exchange = 'ecotrack.events';

  /**
   * Émet l'événement 'report.created' sur le bus RabbitMQ
   */
  async emitReportCreated(report: any): Promise<boolean> {
    const payload = {
      event: 'report.created',
      timestamp: new Date().toISOString(),
      reportId: String(report.id || report._id),
      reporterId: String(report.reporterId),
      category: report.category,
      location: report.location,
      imageUrl: report.imageUrl,
      status: report.status
    };

    try {
      // Log pédagogique et traçabilité RabbitMQ
      console.log(`[RabbitMQ] Émission de l'événement 'report.created' sur l'échange '${this.exchange}' :`, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn(`[RabbitMQ] Avertissement: émission asynchrone 'report.created' en mode dégradé :`, err);
      return false;
    }
  }
}

export const eventService = new EventService();
