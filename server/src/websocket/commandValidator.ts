import {
  RemoteCommand,
  RemoteCommandSchema,
  GoalPayloadSchema,
  CardPayloadSchema,
  PeriodPayloadSchema,
  ScenePayloadSchema,
  TickerPayloadSchema,
  CommandError,
} from 'shared';

export interface ValidationResult {
  valid: boolean;
  error?: CommandError;
  command?: RemoteCommand;
}

export function validateRemoteCommand(data: any): ValidationResult {
  const parseResult = RemoteCommandSchema.safeParse(data);
  if (!parseResult.success) {
    return {
      valid: false,
      error: {
        commandId: data?.commandId || 'unknown',
        matchId: data?.matchId || 'unknown',
        code: 'INVALID_PAYLOAD',
        error: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      },
    };
  }

  const command = parseResult.data as RemoteCommand;

  // Specific payload validation based on action
  switch (command.action) {
    case 'ADD_GOAL': {
      const p = GoalPayloadSchema.safeParse(command.payload);
      if (!p.success) {
        return {
          valid: false,
          error: {
            commandId: command.commandId,
            matchId: command.matchId,
            code: 'INVALID_PAYLOAD',
            error: 'Invalid goal payload: team (home|away) is required',
          },
        };
      }
      break;
    }
    case 'ADD_CARD': {
      const p = CardPayloadSchema.safeParse(command.payload);
      if (!p.success) {
        return {
          valid: false,
          error: {
            commandId: command.commandId,
            matchId: command.matchId,
            code: 'INVALID_PAYLOAD',
            error: 'Invalid card payload: team and type (YELLOW|RED) are required',
          },
        };
      }
      break;
    }
    case 'SET_PERIOD': {
      const p = PeriodPayloadSchema.safeParse(command.payload);
      if (!p.success) {
        return {
          valid: false,
          error: {
            commandId: command.commandId,
            matchId: command.matchId,
            code: 'INVALID_PAYLOAD',
            error: 'Invalid period payload',
          },
        };
      }
      break;
    }
    case 'SET_SCENE': {
      const p = ScenePayloadSchema.safeParse(command.payload);
      if (!p.success) {
        return {
          valid: false,
          error: {
            commandId: command.commandId,
            matchId: command.matchId,
            code: 'INVALID_PAYLOAD',
            error: 'Invalid scene payload',
          },
        };
      }
      break;
    }
    case 'UPDATE_TICKER': {
      const p = TickerPayloadSchema.safeParse(command.payload);
      if (!p.success) {
        return {
          valid: false,
          error: {
            commandId: command.commandId,
            matchId: command.matchId,
            code: 'INVALID_PAYLOAD',
            error: 'Invalid ticker payload',
          },
        };
      }
      break;
    }
  }

  return { valid: true, command };
}
