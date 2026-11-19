import { ReportModel } from '@ecotrack/db';
import { IReport, ReportStatus, UserRole } from '@ecotrack/shared';

export type TransitionCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
export type WorkflowActorRole = UserRole | 'SYSTEM';

export interface TransitionRule {
  code: TransitionCode;
  action: string;
  from: ReportStatus | ReportStatus[];
  to: ReportStatus;
  allowedRoles: WorkflowActorRole[];
  requiresTeam?: boolean;
  requiresAssignment?: boolean;
  requiresReview?: boolean;
  requiresPriority?: boolean;
  requiresReason?: boolean;
  requiresCompletionPhoto?: boolean;
}

export const TRANSITIONS: Record<TransitionCode, TransitionRule> = {
  T1: {
    code: 'T1',
    action: 'CLASSIFY',
    from: ReportStatus.NOUVEAU,
    to: ReportStatus.EN_COURS_DE_VALIDATION,
    allowedRoles: ['SYSTEM']
  },
  T2: {
    code: 'T2',
    action: 'ASSIGN',
    from: ReportStatus.EN_COURS_DE_VALIDATION,
    to: ReportStatus.ASSIGNE,
    allowedRoles: [UserRole.AGENT_MAIRIE, UserRole.AGENT, UserRole.ADMIN_MUNICIPALITE, UserRole.ADMIN_SAAS, UserRole.ADMIN],
    requiresAssignment: true,
    requiresReview: true,
    requiresPriority: true
  },
  T3: {
    code: 'T3',
    action: 'START_WORK',
    from: ReportStatus.ASSIGNE,
    to: ReportStatus.EN_TRAITEMENT,
    allowedRoles: [UserRole.CHEF_OUVRIER, UserRole.OUVRIER, UserRole.ADMIN_MUNICIPALITE, UserRole.ADMIN_SAAS, UserRole.ADMIN],
    requiresAssignment: true
  },
  T4: {
    code: 'T4',
    action: 'CLOSE',
    from: ReportStatus.EN_TRAITEMENT,
    to: ReportStatus.RESOLU,
    allowedRoles: [UserRole.CHEF_OUVRIER, UserRole.OUVRIER, UserRole.ADMIN_MUNICIPALITE, UserRole.ADMIN_SAAS, UserRole.ADMIN],
    requiresCompletionPhoto: true
  },
  T5: {
    code: 'T5',
    action: 'REJECT',
    from: [ReportStatus.NOUVEAU, ReportStatus.EN_COURS_DE_VALIDATION],
    to: ReportStatus.REJETE,
    allowedRoles: [UserRole.AGENT_MAIRIE, UserRole.AGENT, UserRole.ADMIN_MUNICIPALITE, UserRole.ADMIN_SAAS, UserRole.ADMIN],
    requiresReason: true
  }
};

const TRANSITION_ALIASES: Record<string, TransitionCode> = {
  T1: 'T1',
  T1_VALIDATE: 'T1',
  CLASSIFY: 'T1',
  VALIDATE: 'T1',
  VALIDER: 'T1',
  T2: 'T2',
  T2_ASSIGN: 'T2',
  ASSIGN: 'T2',
  ASSIGNER: 'T2',
  T3: 'T3',
  T3_START: 'T3',
  START: 'T3',
  START_WORK: 'T3',
  DEMARRER: 'T3',
  T4: 'T4',
  T4_CLOSE: 'T4',
  CLOSE: 'T4',
  RESOLVE: 'T4',
  CLOTURER: 'T4',
  T5: 'T5',
  T5_REJECT: 'T5',
  REJECT: 'T5',
  REJETER: 'T5'
};

const TARGET_STATUS_ALIASES: Record<string, ReportStatus> = {
  NOUVEAU: ReportStatus.NOUVEAU,
  RECEIVED: ReportStatus.NOUVEAU,
  TO_PROCESS: ReportStatus.EN_COURS_DE_VALIDATION,
  VALIDE: ReportStatus.VALIDE,
  VALIDATED: ReportStatus.VALIDE,
  ASSIGNE: ReportStatus.ASSIGNE,
  ASSIGNED: ReportStatus.ASSIGNE,
  EN_TRAITEMENT: ReportStatus.EN_TRAITEMENT,
  IN_PROGRESS: ReportStatus.EN_TRAITEMENT,
  RESOLU: ReportStatus.RESOLU,
  RESOLVED: ReportStatus.RESOLU,
  REJETE: ReportStatus.REJETE,
  REJECTED: ReportStatus.REJETE
};

const ROLE_ALIASES: Record<string, WorkflowActorRole> = {
  CITIZEN: UserRole.CITOYEN,
  CITOYEN: UserRole.CITOYEN,
  AGENT_MAIRIE: UserRole.AGENT_MAIRIE,
  DISPATCHER: UserRole.AGENT_MAIRIE,
  AGENT: UserRole.AGENT_MAIRIE,
  CHEF_OUVRIER: UserRole.CHEF_OUVRIER,
  WORKER: UserRole.CHEF_OUVRIER,
  OUVRIER: UserRole.CHEF_OUVRIER,
  ADMIN_MUNICIPALITE: UserRole.ADMIN_MUNICIPALITE,
  ADMIN_SAAS: UserRole.ADMIN_SAAS,
  ADMIN: UserRole.ADMIN_SAAS,
  ADMINISTRATOR: UserRole.ADMIN_SAAS,
  SYSTEM: 'SYSTEM'
};

export interface ExecuteTransitionInput {
  reportId: string;
  transition: string;
  actorRole: string;
  actorId?: string;
  targetStatus?: string;
  reason?: string;
  teamId?: string;
  assigneeId?: string;
  priority?: string;
  reviewValidated?: boolean;
  completionPhotoUrl?: string;
  categoryValidated?: string;
}

export interface ReopenReportInput {
  reportId: string;
  actorRole: string;
  actorId?: string;
  reason?: string;
}

export class WorkflowError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class InvalidTransitionError extends WorkflowError {
  constructor(message: string) {
    super(message, 409, 'INVALID_STATE_TRANSITION');
  }
}

export class WorkflowForbiddenError extends WorkflowError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN_ROLE');
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export function normalizeTransition(input: string): TransitionCode {
  const key = String(input || '').trim().toUpperCase();
  const code = TRANSITION_ALIASES[key];
  if (!code) {
    throw new InvalidTransitionError(`Transition inconnue: '${input}'.`);
  }
  return code;
}

export function normalizeRole(input: string): WorkflowActorRole {
  const key = String(input || '').trim().toUpperCase();
  const role = ROLE_ALIASES[key];
  if (!role) {
    throw new WorkflowForbiddenError(`Rôle '${input}' non autorisé.`);
  }
  return role;
}

export function normalizeTargetStatus(input: string): ReportStatus | null {
  const key = String(input || '').trim().toUpperCase();
  return TARGET_STATUS_ALIASES[key] || null;
}

export function canTransition(
  currentStatus: string,
  targetStatus: string,
  role: string
): boolean {
  const normalizedCurrent = normalizeTargetStatus(currentStatus);
  const normalizedTarget = normalizeTargetStatus(targetStatus);

  if (!normalizedCurrent || !normalizedTarget) {
    return false;
  }

  let normalizedRole: WorkflowActorRole;
  try {
    normalizedRole = normalizeRole(role);
  } catch {
    return false;
  }

  return Object.values(TRANSITIONS).some((rule) => {
    const fromStatuses = Array.isArray(rule.from) ? rule.from : [rule.from];
    return (
      fromStatuses.includes(normalizedCurrent) &&
      rule.to === normalizedTarget &&
      rule.allowedRoles.includes(normalizedRole)
    );
  });
}

export class StateMachineService {
  async executeTransition(input: ExecuteTransitionInput): Promise<IReport> {
    if (!input.reportId) {
      throw new WorkflowValidationError('Le reportId est obligatoire.');
    }

    const report = await ReportModel.findById(input.reportId);
    if (!report) {
      throw new WorkflowNotFoundError(`Signalement #${input.reportId} introuvable.`);
    }

    const code = normalizeTransition(input.transition);
    const rule = TRANSITIONS[code];
    const actorRole = normalizeRole(input.actorRole);
    const currentStatus = report.status as ReportStatus;

    if (input.targetStatus) {
      const targetStatus = normalizeTargetStatus(input.targetStatus);
      if (!targetStatus || targetStatus !== rule.to) {
        throw new InvalidTransitionError(
          `La transition ${code} mène obligatoirement au statut '${rule.to}'.`
        );
      }
    }

    const fromStatuses = Array.isArray(rule.from) ? rule.from : [rule.from];
    if (!fromStatuses.includes(currentStatus)) {
      throw new InvalidTransitionError(
        `Impossible d'exécuter ${code} depuis le statut '${currentStatus}'.`
      );
    }

    if (!rule.allowedRoles.includes(actorRole)) {
      throw new WorkflowForbiddenError(
        `Le rôle '${actorRole}' n'est pas autorisé à exécuter la transition ${code}.`
      );
    }

    if (rule.requiresTeam && !input.teamId) {
      throw new WorkflowValidationError(
        `La transition ${code} exige l'identification d'une équipe (teamId).`
      );
    }

    if (
      code === 'T2' &&
      rule.requiresAssignment &&
      !input.teamId &&
      !input.assigneeId
    ) {
      throw new WorkflowValidationError(
        `La transition ${code} exige un ouvrier ou une équipe assignée.`
      );
    }

    if (rule.requiresReview && input.reviewValidated !== true) {
      throw new WorkflowValidationError(
        `La transition ${code} exige la validation humaine de la classification.`
      );
    }

    if (rule.requiresPriority && !input.priority?.trim()) {
      throw new WorkflowValidationError(
        `La transition ${code} exige une priorité.`
      );
    }

    const normalizedCompletionPhotoUrl = input.completionPhotoUrl?.trim();
    if (
      code === 'T3' &&
      !report.assignedTeamId &&
      !report.assignedWorkerId
    ) {
      throw new WorkflowValidationError(
        'La transition T3 exige une assignation existante.'
      );
    }

    if (
      (code === 'T3' || code === 'T4') &&
      (actorRole === UserRole.CHEF_OUVRIER || actorRole === UserRole.OUVRIER) &&
      (!report.assignedWorkerId || report.assignedWorkerId !== input.actorId)
    ) {
      throw new WorkflowForbiddenError(
        "L'ouvrier ou chef d'équipe n'est pas assigné à ce signalement."
      );
    }

    if (rule.requiresReason && !input.reason?.trim()) {
      throw new WorkflowValidationError(
        `La transition ${code} exige un motif de rejet (reason).`
      );
    }

    if (
      rule.requiresCompletionPhoto &&
      !normalizedCompletionPhotoUrl
    ) {
      throw new WorkflowValidationError(
        'La photo après travaux est obligatoire pour clôturer le chantier.'
      );
    }

    const now = new Date();
    const history = report.statusHistory || [];

    history.push({
      from: currentStatus,
      to: rule.to,
      transition: code,
      actorId: input.actorId,
      actorRole,
      reason: input.reason,
      timestamp: now
    });

    report.status = rule.to;
    report.statusHistory = history;

    if (input.categoryValidated) {
      report.categoryValidated = input.categoryValidated;
    }

    if (input.teamId) {
      report.assignedTeamId = input.teamId;
    }
    if (input.assigneeId) {
      report.assignedWorkerId = input.assigneeId;
    }
    if (input.priority) {
      report.priority = input.priority.trim();
    }

    if (code === 'T2') {
      report.assignedAt = now;
      report.validatedAt = now;
      report.reviewValidated = true;
      report.reviewedBy = input.actorId;
    }
    if (code === 'T3') {
      report.startedAt = now;
    }
    if (code === 'T4') {
      report.resolvedAt = now;
      report.completionPhotoUrl = normalizedCompletionPhotoUrl;
    }
    if (code === 'T5') {
      report.rejectedAt = now;
      report.rejectionReason = input.reason;
    }

    await report.save();

    return report.toJSON() as unknown as IReport;
  }

  async reopenReport(input: ReopenReportInput): Promise<IReport> {
    if (!input.reportId) {
      throw new WorkflowValidationError('Le reportId est obligatoire.');
    }

    const actorRole = normalizeRole(input.actorRole);
    if (
      actorRole !== UserRole.ADMIN &&
      actorRole !== UserRole.ADMIN_SAAS &&
      actorRole !== UserRole.ADMIN_MUNICIPALITE
    ) {
      throw new WorkflowForbiddenError(
        'Seul un administrateur (SaaS ou Municipalité) peut rouvrir un signalement.'
      );
    }

    if (!input.reason?.trim()) {
      throw new WorkflowValidationError(
        'Le motif de réouverture (reopenReason) est obligatoire.'
      );
    }

    const report = await ReportModel.findById(input.reportId);
    if (!report) {
      throw new WorkflowNotFoundError(`Signalement #${input.reportId} introuvable.`);
    }

    const currentStatus = report.status as ReportStatus;
    if (currentStatus !== ReportStatus.RESOLU) {
      throw new InvalidTransitionError(
        `Impossible de rouvrir un signalement au statut '${currentStatus}'. Statut attendu: '${ReportStatus.RESOLU}'.`
      );
    }

    const now = new Date();
    const history = report.statusHistory || [];

    history.push({
      from: currentStatus,
      to: ReportStatus.ASSIGNE,
      transition: 'REOPEN',
      actorId: input.actorId,
      actorRole,
      reason: input.reason,
      timestamp: now
    });

    report.status = ReportStatus.ASSIGNE;
    report.statusHistory = history;
    report.reopenReason = input.reason.trim();
    report.assignedAt = now;
    report.resolvedAt = undefined;
    report.startedAt = undefined;
    report.completionPhotoUrl = undefined;

    await report.save();

    return report.toJSON() as unknown as IReport;
  }
}

export const stateMachineService = new StateMachineService();
