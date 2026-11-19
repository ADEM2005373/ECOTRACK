import { FigmaLayout } from '../components/layout/FigmaLayout';
import { SupervisionMap } from '../components/map/SupervisionMap';
import { MAP_STRINGS } from '../components/map/strings.fr';

export default function SupervisionPage() {
  return (
    <FigmaLayout pageSpace="Supervision Géospatiale" pageTitle="Cartographie Métropolitaine 2dsphere">
      <div className="space-y-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            {MAP_STRINGS.pageTitle}
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            {MAP_STRINGS.pageSubtitle}
          </p>
        </div>

        <SupervisionMap />
      </div>
    </FigmaLayout>
  );
}
