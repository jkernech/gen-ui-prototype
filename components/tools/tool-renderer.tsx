'use client';

import React from 'react';
import { getToolForPart } from './registry';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from '@/components/ai-elements/task';

type Props = {
  part: any;
  messageId?: string;
  index?: number;
};

export function ToolRenderer({ part, messageId, index }: Props) {
  const resolved = getToolForPart(part);
  if (!resolved) return null;

  const { desc, Comp: ToolComp } = resolved;
  const title = desc?.getTitle ? desc.getTitle(part) : 'Task';
  const taskItems = desc?.getTaskItems?.(part) ??
    desc?.taskItems ?? [
      'Preparing inputs',
      'Calling tool',
      'Formatting response',
    ];
  const props = desc?.propMapper
    ? desc.propMapper(part)
    : { ...(part.input ?? {}) };

  return (
    <div key={`${messageId}-${index}`} className="flex-col w-2xl">
      {part.input && (
        <Task className="w-full mb-8">
          <TaskTrigger title={title} />
          <TaskContent>
            {taskItems.map((item, idx) => (
              <TaskItem key={idx}>{item}</TaskItem>
            ))}
          </TaskContent>
        </Task>
      )}

      {(part.state === 'input-streaming' || part.state === 'input-available') &&
        (desc?.loader ?? (
          <div className="mx-auto my-6 animate-pulse border shadow-md w-full" />
        ))}

      {part.state === 'output-available' && <ToolComp {...props} />}
    </div>
  );
}

export default ToolRenderer;
