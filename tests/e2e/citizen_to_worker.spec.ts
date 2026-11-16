import { test, expect } from "@playwright/test";

const runE2E = process.env.E2E_RUN === "true";
const apiBase = (
  process.env.E2E_API_URL || "http://127.0.0.1:8080/api/v1"
).replace(/\/+$/, "");

test.describe("EcoTrack full lifecycle", () => {
  test.skip(
    !runE2E,
    "Set E2E_RUN=true with the running EcoTrack stack to execute lifecycle tests.",
  );

  test("citizen report reaches resolved worker state", async ({ request }) => {
    const reporterId = process.env.E2E_REPORTER_ID;
    const agentId = process.env.E2E_AGENT_ID;
    const workerId = process.env.E2E_WORKER_ID;
    const reportId = process.env.E2E_REPORT_ID;

    expect(
      reporterId || reportId,
      "Set E2E_REPORTER_ID or E2E_REPORT_ID.",
    ).toBeTruthy();
    expect(agentId, "Set E2E_AGENT_ID.").toBeTruthy();
    expect(workerId, "Set E2E_WORKER_ID.").toBeTruthy();

    const reportResponse = reportId
      ? await request.get(`${apiBase}/reports/${reportId}`)
      : await request.post(`${apiBase}/reports`, {
          data: {
            reporterId,
            category: "NID_DE_POULE",
            description: "Signalement E2E Playwright",
            imageUrl: "https://storage.ecotrack.local/e2e/before.webp",
            latitude: 36.8065,
            longitude: 10.1815,
          },
        });
    expect(reportResponse.ok()).toBeTruthy();
    const report = await reportResponse.json();
    const id = report.id ?? report.report?.id;
    expect(id).toBeTruthy();

    const classification = await request.post(
      `${apiBase}/workflow/transition`,
      {
        data: {
          reportId: id,
          transition: "T1",
          actorRole: "SYSTEM",
          actorId: "e2e-system",
        },
      },
    );
    expect(classification.status()).toBe(200);
    expect((await classification.json()).status).toBe("EN_COURS_DE_VALIDATION");

    const assignment = await request.post(`${apiBase}/workflow/transition`, {
      data: {
        reportId: id,
        transition: "T2",
        actorRole: "AGENT",
        actorId: agentId,
        assigneeId: workerId,
        priority: "HAUTE",
        reviewValidated: true,
      },
    });
    expect(assignment.status()).toBe(200);
    expect((await assignment.json()).status).toBe("ASSIGNE");

    const transition = await request.post(`${apiBase}/workflow/transition`, {
      data: {
        reportId: id,
        action: "START_WORK",
        actorRole: "OUVRIER",
        actorId: workerId,
      },
    });
    expect(transition.status()).toBe(200);
    expect((await transition.json()).status).toBe("EN_TRAITEMENT");

    const resolution = await request.post(`${apiBase}/reports/${id}/resolve`, {
      data: {
        actorRole: "OUVRIER",
        actorId: workerId,
        completionImageUrl: "https://storage.ecotrack.local/e2e/after.webp",
      },
    });
    expect(resolution.status()).toBe(200);
    expect((await resolution.json()).status).toBe("RESOLU");
  });
});
