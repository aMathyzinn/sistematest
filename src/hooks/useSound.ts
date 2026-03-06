import { useSettingsStore } from '@/stores/settingsStore';
import {
  playClick,
  playNavSwitch,
  playToggle,
  playSuccess,
  playDelete,
  playNotificationSound,
  playAlarmSound,
} from '@/lib/audio';

type SoundFn = () => void;
const noop: SoundFn = () => {};

function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const guard = (fn: SoundFn): SoundFn =>
    soundEnabled ? fn : noop;

  return {
    click:        guard(playClick),
    navSwitch:    guard(playNavSwitch),
    toggle:       guard(playToggle),
    success:      guard(playSuccess),
    delete:       guard(playDelete),
    notification: guard(playNotificationSound),
    alarm:        guard(playAlarmSound),
  };
}

export default useSound;
