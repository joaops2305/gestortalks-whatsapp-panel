import { ResourceCrudPage } from '@/modules/platform/ResourceCrudPage';
import { ApplicationInstancesManager } from '@/modules/platform/ApplicationInstancesManager';

export default function AplicacoesPage() {
  return (
    <>
      <ResourceCrudPage resource="applications" />
      <ApplicationInstancesManager />
    </>
  );
}
