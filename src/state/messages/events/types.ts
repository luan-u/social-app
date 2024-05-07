import {BskyAgent, ChatBskyConvoGetLog} from '@atproto-labs/api'

export type MessagesEventBusParams = {
  agent: BskyAgent
  __tempFromUserDid: string
}

export enum MessagesEventBusStatus {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Ready = 'ready',
  Error = 'error',
  Suspended = 'suspended',
}

export enum MessagesEventBusDispatchEvent {
  Init = 'init',
  Ready = 'ready',
  Error = 'error',
  Suspend = 'suspend',
  Resume = 'resume',
}

export enum MessagesEventBusErrorCode {
  Unknown = 'unknown',
  InitFailed = 'initFailed',
  PollFailed = 'pollFailed',
}

export type MessagesEventBusError = {
  code: MessagesEventBusErrorCode
  exception?: Error
  retry: () => void
}

export type MessagesEventBusDispatch =
  | {
      event: MessagesEventBusDispatchEvent.Init
    }
  | {
      event: MessagesEventBusDispatchEvent.Ready
    }
  | {
      event: MessagesEventBusDispatchEvent.Suspend
    }
  | {
      event: MessagesEventBusDispatchEvent.Resume
    }
  | {
      event: MessagesEventBusDispatchEvent.Error
      payload: MessagesEventBusError
    }

export type MessagesEventBusState =
  | {
      status: MessagesEventBusStatus.Uninitialized
      rev: undefined
      error: undefined
      setPollInterval: (interval: number) => void
      trail: (
        handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
      ) => () => void
    }
  | {
      status: MessagesEventBusStatus.Initializing
      rev: undefined
      error: undefined
      setPollInterval: (interval: number) => void
      trail: (
        handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
      ) => () => void
    }
  | {
      status: MessagesEventBusStatus.Ready
      rev: string
      error: undefined
      setPollInterval: (interval: number) => void
      trail: (
        handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
      ) => () => void
    }
  | {
      status: MessagesEventBusStatus.Suspended
      rev: string | undefined
      error: undefined
      setPollInterval: (interval: number) => void
      trail: (
        handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
      ) => () => void
    }
  | {
      status: MessagesEventBusStatus.Error
      rev: string | undefined
      error: MessagesEventBusError
      setPollInterval: (interval: number) => void
      trail: (
        handler: (events: ChatBskyConvoGetLog.OutputSchema['logs']) => void,
      ) => () => void
    }
