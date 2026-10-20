import { getAppCopy } from '../src/constants/appCopy';
import { confirmReplaceSave } from '../src/utils/importConfirm';
import { createInitialGameState } from '../src/utils/initialState';

type Button = { text?: string; onPress?: () => void };

describe('confirmReplaceSave (#49)', () => {
  const copy = getAppCopy('en');
  const state = { ...createInitialGameState(), coins: 42 };

  const ask = (pick: (buttons: Button[], options: { onDismiss?: () => void }) => void) =>
    confirmReplaceSave(copy, state, (_title, message, buttons, options) => {
      expect(message).toContain('42 coins');
      pick(buttons as Button[], options as { onDismiss?: () => void });
    });

  it('resolves false on Cancel, so the save is left alone', async () => {
    await expect(ask((buttons) => buttons.find((b) => b.text === copy.addTaskCancel)?.onPress?.())).resolves.toBe(false);
  });

  it('resolves false when the dialog is dismissed', async () => {
    await expect(ask((_buttons, options) => options.onDismiss?.())).resolves.toBe(false);
  });

  it('resolves true only on Replace', async () => {
    await expect(ask((buttons) => buttons.find((b) => b.text === copy.importConfirmReplace)?.onPress?.())).resolves.toBe(true);
  });
});
