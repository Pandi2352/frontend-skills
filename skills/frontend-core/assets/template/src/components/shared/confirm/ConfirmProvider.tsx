import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/fields/text/Input';
import { Modal } from '@/components/ui/modal';
import { uiText } from '@/constants/ui-text';
import { ConfirmContext, type Confirm, type ConfirmOptions } from './confirm-context';

interface Request {
  id: number;
  options: ConfirmOptions;
  resolve: (answer: boolean) => void;
}

function ConfirmDialog({ request, onDone }: { request: Request; onDone: (answer: boolean) => void }) {
  const { title, message, confirmLabel = uiText.confirm, cancelLabel = uiText.cancel, variant = 'primary', requireText, onConfirm } = request.options;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const ready = !requireText || text.trim() === requireText;

  const accept = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setProblem('');
    try {
      await onConfirm?.();
      onDone(true);
    } catch (error) {
      setProblem(error instanceof Error && error.message ? error.message : uiText.errorTitle);
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="sm"
      role="alertdialog"
      title={title}
      description={message}
      busy={busy}
      hideClose
      // The safe choice has focus first.
      initialFocus={cancelRef}
      onClose={() => onDone(false)}
      footer={
        <>
          <Button ref={cancelRef} variant="outline" disabled={busy} onClick={() => onDone(false)}>
            {cancelLabel}
          </Button>
          <Button variant={variant} isLoading={busy} disabled={!ready} onClick={() => void accept()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {(requireText || problem) && (
        <div className="flex flex-col gap-3">
          {requireText && (
            <Input
              label={uiText.typeToConfirm(requireText)}
              value={text}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void accept()}
            />
          )}
          {problem && <Alert variant="error">{problem}</Alert>}
        </div>
      )}
    </Modal>
  );
}

/** Mount once. Requests made together are asked one after another. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Request[]>([]);
  const nextId = useRef(1);
  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise((resolve) => {
        const id = nextId.current++;
        setQueue((list) => [...list, { id, options, resolve }]);
      }),
    [],
  );
  const current = queue[0];
  return (
    <ConfirmContext value={confirm}>
      {children}
      {current && (
        <ConfirmDialog
          key={current.id}
          request={current}
          onDone={(answer) => {
            setQueue((list) => list.filter((r) => r !== current));
            current.resolve(answer);
          }}
        />
      )}
    </ConfirmContext>
  );
}
