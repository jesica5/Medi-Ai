export interface AlertDispatchResult {
  success: boolean;
  alertId?: string;
  provider: string;
  error?: string;
}

export interface AlertProvider {
  dispatch(assessmentId: string, priority: string, details: string[]): Promise<AlertDispatchResult>;
}

export class ConsoleAlertProvider implements AlertProvider {
  private simulateFailure: boolean;

  constructor(simulateFailure = false) {
    this.simulateFailure = simulateFailure;
  }

  async dispatch(assessmentId: string, priority: string, details: string[]): Promise<AlertDispatchResult> {
    if (this.simulateFailure) {
      return {
        success: false,
        provider: 'ConsoleAlertProvider',
        error: 'Alert provider endpoint unreachable (503 Service Unavailable)',
      };
    }

    // In non-testing environments, log out the notification
    const logMsg = `[ALERT DISPATCHED] Assessment: ${assessmentId} | Priority: ${priority} | Details: ${details.join('; ')}`;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(logMsg);
    }

    return {
      success: true,
      alertId: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: 'ConsoleAlertProvider',
    };
  }
}
