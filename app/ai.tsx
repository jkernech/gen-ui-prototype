import { createAI } from '@ai-sdk/rsc';
import { type ServerMessage, type ClientMessage, continueConversation } from './actions';

export const AIProvider = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
