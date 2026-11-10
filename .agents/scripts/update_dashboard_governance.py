import sys

with open('dashboard/po_scrum_master_dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Global KPI from 29.6% to 22.2% Real Git
old_kpi = """          <div class="mt-2">
            <div class="text-2xl font-black text-white">29.6 %</div>
            <p class="text-[11px] text-slate-400 mt-0.5">8 sur 27 tâches closes</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div class="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full" style="width: 29.6%"></div>
          </div>"""

new_kpi = """          <div class="mt-2">
            <div class="text-2xl font-black text-emerald-400">22.2 % <span class="text-xs font-normal text-slate-400">(Réel Git)</span></div>
            <p class="text-[11px] text-rose-400 mt-0.5 font-medium">6 / 27 sur Git (2 livraisons fictives)</p>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div class="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full" style="width: 22.2%"></div>
          </div>"""

if old_kpi in html:
    html = html.replace(old_kpi, new_kpi, 1)
    print("Updated KPI 1 successfully.")
else:
    print("Could not match old KPI 1.")

# 2. Add Anti-Fraud Banner before Detailed Member Roster Cards
target_roster = "<!-- Section: Detailed Member Roster Cards -->"

banner_html = """<!-- DevLead Governance Alert Banner: Anti-Fraud Jira vs Git Audit -->
      <div class="bg-rose-950/40 border-2 border-rose-500/50 rounded-xl p-4 md:p-5 relative overflow-hidden backdrop-blur-md shadow-2xl shadow-rose-950/50">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
              <i data-lucide="shield-alert" class="w-6 h-6 animate-pulse"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm font-bold text-white tracking-wide uppercase">Audit Gouvernance Dev Lead : Discordance Jira vs GitHub (Anti-Fraude)</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/40 uppercase">Règle d'or : No Push = No Done</span>
              </div>
              <p class="text-xs text-slate-300 mt-1">
                <b class="text-rose-400">2 livraisons fictives détectées :</b> Des tickets sont passés à <b>« Terminé »</b> sur Jira sans aucun commit sur GitHub. Sara Shih n'a pas accepté l'invitation repo, et Ahmed Salah n'a poussé aucune branche.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <div class="bg-dark-bg/80 border border-rose-500/30 px-3 py-1.5 rounded-lg text-center">
              <div class="text-[10px] uppercase font-bold text-slate-400">Déclaré Jira</div>
              <div class="text-sm font-extrabold text-amber-400">29.6% (8/27)</div>
            </div>
            <div class="text-slate-500 font-bold">vs</div>
            <div class="bg-dark-bg/80 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-center">
              <div class="text-[10px] uppercase font-bold text-emerald-400">Réel Git</div>
              <div class="text-sm font-extrabold text-emerald-400">22.2% (6/27)</div>
            </div>
          </div>
        </div>

        <!-- Audit Table -->
        <div class="mt-4 pt-3 border-t border-rose-500/20 overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-rose-500/20">
                <th class="pb-2">Membre</th>
                <th class="pb-2">Ticket Jira</th>
                <th class="pb-2">Statut Jira</th>
                <th class="pb-2">Commits GitHub</th>
                <th class="pb-2">Verdict Dev Lead / DoD</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr>
                <td class="py-1.5 text-white font-sans font-semibold">Adem Ouerhani</td>
                <td class="py-1.5 text-sky-400">SCRUM-38, 42, 47, 55, 56</td>
                <td class="py-1.5"><span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans">Terminé (5)</span></td>
                <td class="py-1.5 text-emerald-400">25 commits vérifiés</td>
                <td class="py-1.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">🟢 Conforme & Livré</span></td>
              </tr>
              <tr>
                <td class="py-1.5 text-white font-sans font-semibold">Hiba Dhouib</td>
                <td class="py-1.5 text-emerald-400">SCRUM-40 (ECO-03)</td>
                <td class="py-1.5"><span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans">Terminé (1)</span></td>
                <td class="py-1.5 text-emerald-400">2 commits (7796ed2)</td>
                <td class="py-1.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">🟢 Conforme & Livré</span></td>
              </tr>
              <tr class="bg-rose-500/10">
                <td class="py-1.5 text-white font-sans font-semibold">Ahmed Salah</td>
                <td class="py-1.5 text-amber-400">SCRUM-39 (ECO-02)</td>
                <td class="py-1.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-sans font-bold">Terminé à tort</span></td>
                <td class="py-1.5 text-rose-400 font-bold">0 commit sur GitHub</td>
                <td class="py-1.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">🔴 Livraison Fictive (Fraude)</span></td>
              </tr>
              <tr class="bg-rose-500/10">
                <td class="py-1.5 text-white font-sans font-semibold">Sara Shih</td>
                <td class="py-1.5 text-rose-400">SCRUM-41 (ECO-04)</td>
                <td class="py-1.5"><span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-sans font-bold">Terminé à tort</span></td>
                <td class="py-1.5 text-rose-400 font-bold">0 commit (Invite pending)</td>
                <td class="py-1.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">🔴 Livraison Fictive (Fraude)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: Detailed Member Roster Cards -->"""

if target_roster in html:
    html = html.replace(target_roster, banner_html, 1)
    print("Inserted Governance Banner successfully.")
else:
    print("Could not find target roster.")

# 3. Update Sara Shih card
sara_old = """                <div class="text-right">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">1 Close / 1 En cours</span>
                  <div class="text-[11px] text-slate-400 mt-1">1 / 7 tâche close (14.3%)</div>
                </div>"""

sara_new = """                <div class="text-right">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">🔴 0% Réel Git</span>
                  <div class="text-[11px] text-rose-400 mt-1">0 commit (Invite non acceptée)</div>
                </div>"""

if sara_old in html:
    html = html.replace(sara_old, sara_new, 1)
    print("Updated Sara card header.")

# 4. Update Ahmed Salah card
ahmed_old = """                <div class="text-right">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">1 Close / Prêt S2</span>
                  <div class="text-[11px] text-slate-400 mt-1">1 / 6 tâche close (16.7%)</div>
                </div>"""

ahmed_new = """                <div class="text-right">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">🔴 0% Réel Git</span>
                  <div class="text-[11px] text-rose-400 mt-1">0 commit sur tout le repo</div>
                </div>"""

if ahmed_old in html:
    html = html.replace(ahmed_old, ahmed_new, 1)
    print("Updated Ahmed card header.")

with open('dashboard/po_scrum_master_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("po_scrum_master_dashboard.html completely updated.")
