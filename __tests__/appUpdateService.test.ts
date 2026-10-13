import {
  AppUpdateCheck,
  AppUpdateClient,
  AppUpdateProgress,
  createAppUpdateController,
  decideUpdatePrompt,
} from '../src/services/appUpdateService';

function makeCheck(overrides: Partial<AppUpdateCheck> = {}): AppUpdateCheck {
  return { available: true, priority: 0, flexibleAllowed: true, immediateAllowed: true, downloaded: false, ...overrides };
}

function fakeClient(checkResult: AppUpdateCheck | null, flexibleAccepted = true) {
  const client = {
    checks: 0,
    completed: 0,
    immediateStarted: 0,
    listener: null as ((progress: AppUpdateProgress) => void) | null,
    check: async () => {
      client.checks += 1;
      return checkResult;
    },
    startFlexible: async () => flexibleAccepted,
    completeFlexible: async () => {
      client.completed += 1;
    },
    startImmediate: async () => {
      client.immediateStarted += 1;
    },
    onProgress: (listener: (progress: AppUpdateProgress) => void) => {
      client.listener = listener;
    },
  };
  return client satisfies AppUpdateClient;
}

describe('decideUpdatePrompt', () => {
  it('shows nothing when updates cannot be checked or none exists', () => {
    expect(decideUpdatePrompt(null)).toBe('none');
    expect(decideUpdatePrompt(makeCheck({ available: false }))).toBe('none');
  });

  it('offers a normal update below priority 4 and blocks from 4', () => {
    expect(decideUpdatePrompt(makeCheck({ priority: 3 }))).toBe('available');
    expect(decideUpdatePrompt(makeCheck({ priority: 4 }))).toBe('required');
    expect(decideUpdatePrompt(makeCheck({ priority: 5 }))).toBe('required');
  });

  it('falls back to the normal prompt when Play does not allow an immediate update', () => {
    expect(decideUpdatePrompt(makeCheck({ priority: 5, immediateAllowed: false }))).toBe('available');
  });

  it('asks for a restart when an earlier download finished', () => {
    expect(decideUpdatePrompt(makeCheck({ available: false, downloaded: true }))).toBe('ready');
  });
});

describe('createAppUpdateController', () => {
  it('checks Play only once', async () => {
    const client = fakeClient(null);
    const controller = createAppUpdateController(client);
    await controller.checkOnce();
    await controller.checkOnce();
    expect(client.checks).toBe(1);
    expect(controller.getSnapshot().state).toBe('none');
  });

  it('walks available → downloading → ready → restart and notifies subscribers', async () => {
    const client = fakeClient(makeCheck());
    const controller = createAppUpdateController(client);
    let notified = 0;
    controller.subscribe(() => {
      notified += 1;
    });
    await controller.checkOnce();
    expect(controller.getSnapshot().state).toBe('available');

    await controller.update();
    expect(controller.getSnapshot().state).toBe('downloading');
    client.listener?.({ status: 'downloading', fraction: 0.42 });
    expect(controller.getSnapshot().progress).toBe(0.42);
    client.listener?.({ status: 'downloaded', fraction: 1 });
    expect(controller.getSnapshot().state).toBe('ready');
    expect(notified).toBeGreaterThan(3);

    await controller.restart();
    expect(client.completed).toBe(1);
  });

  it('hides the prompt when the user declines or the download fails', async () => {
    const declined = createAppUpdateController(fakeClient(makeCheck(), false));
    await declined.checkOnce();
    await declined.update();
    expect(declined.getSnapshot().state).toBe('none');

    const client = fakeClient(makeCheck());
    const failing = createAppUpdateController(client);
    await failing.checkOnce();
    await failing.update();
    client.listener?.({ status: 'failed', fraction: null });
    expect(failing.getSnapshot().state).toBe('none');
  });

  it('Later hides it; the required sheet stays after starting the immediate update', async () => {
    const optional = createAppUpdateController(fakeClient(makeCheck()));
    await optional.checkOnce();
    optional.later();
    expect(optional.getSnapshot().state).toBe('none');

    const client = fakeClient(makeCheck({ priority: 5 }));
    const required = createAppUpdateController(client);
    await required.checkOnce();
    await required.updateNow();
    expect(client.immediateStarted).toBe(1);
    expect(required.getSnapshot().state).toBe('required');
  });
});
