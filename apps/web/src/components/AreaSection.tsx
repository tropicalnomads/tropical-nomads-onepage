import type { WebAreaId } from 'tropical-nomads-shared';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { areaDescription } from '../areas';
import { navigation } from '../navigation';

export function AreaSection({ id }: { id: WebAreaId }) {
  const area = navigation.find((item) => item.id === id);
  const label = area?.label ?? id;

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{label}</h2>
        <div className="mt-6">
          <EmptyState title={label} description={areaDescription[id]} />
        </div>
      </div>
    </section>
  );
}
