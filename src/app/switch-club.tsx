import { ClubList } from '@/components/ClubList';
import { closeModal, Sheet } from '@/components/Sheet';
import { useApp } from '@/state/app';
import { useToast } from '@/state/toast';

export default function SwitchClub() {
  const { clubs, club, setClub } = useApp();
  const toast = useToast();
  return (
    <Sheet title="Switch club">
      <ClubList
        clubs={clubs}
        currentId={club?.id}
        onPick={(id) => {
          closeModal();
          if (id === club?.id) return toast(`${club.name} is already your home club`);
          setClub(id);
          toast(`${clubs.find((c) => c.id === id)?.name} is now your home club`);
        }}
      />
    </Sheet>
  );
}
